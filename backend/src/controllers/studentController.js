import path from 'node:path'
import { findExaminerByGuide } from '../services/studentData.js'
import { PblSubmission } from '../models/PblSubmission.js'
import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) return false
  const start = new Date(startDate)
  const end = new Date(endDate)
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end
}

function buildSubmissionStatus(attemptCount) {
  return {
    attemptCount,
    canSubmit: attemptCount < 2,
    canResubmit: attemptCount === 1,
    isLocked: attemptCount >= 2,
  }
}

export function getExaminerByGuide(req, res) {
  const guideName = req.query.guideName || ''
  const result = findExaminerByGuide(guideName)

  if (!result) {
    return res.status(404).json({ error: 'No examiner mapping found for this guide.' })
  }

  return res.json(result)
}

export async function getMySubmissionStatus(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const submittedBy = req.user.registrationNumber || req.user.id
  const [attemptCount, latestSubmission] = await Promise.all([
    PblSubmission.countDocuments({ submittedBy }),
    PblSubmission.findOne({ submittedBy }).sort({ createdAt: -1 }).lean(),
  ])

  return res.json({
    ...buildSubmissionStatus(attemptCount),
    latestSubmission,
  })
}

export async function submitPblPresentation(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const submittedBy = req.user.registrationNumber || req.user.id
  const attemptCount = await PblSubmission.countDocuments({ submittedBy })
  if (attemptCount >= 2) {
    return res.status(403).json({ error: 'Submission locked. You have already used both attempts.' })
  }

  const {
    submissionType,
    registrationId,
    name,
    pbl,
    onlineLink,
    githubRepo,
    projectName,
    companyName,
    domainJobProfile,
    internshipStartDate,
    internshipEndDate,
  } = req.body

  if (!submissionType || !registrationId || !name) {
    return res.status(400).json({ error: 'Submission type, registration ID and name are required.' })
  }

  if (!['major-project', 'internship'].includes(submissionType)) {
    return res.status(400).json({ error: 'Invalid submission type.' })
  }

  if (submissionType === 'major-project') {
    if (!pbl || !onlineLink || !githubRepo || !projectName) {
      return res.status(400).json({ error: 'Major project details are required.' })
    }

    if (!['PBL-2', 'PBL-4'].includes(pbl)) {
      return res.status(400).json({ error: 'Invalid PBL selection.' })
    }

    if (!isValidUrl(onlineLink) || !isValidUrl(githubRepo)) {
      return res.status(400).json({ error: 'Online link and GitHub repo must be valid URLs.' })
    }
  }

  if (submissionType === 'internship') {
    if (!companyName || !domainJobProfile || !internshipStartDate || !internshipEndDate) {
      return res.status(400).json({ error: 'Internship details are required.' })
    }

    if (!isDateRangeValid(internshipStartDate, internshipEndDate)) {
      return res.status(400).json({ error: 'Invalid internship duration.' })
    }

    if (!req.file && attemptCount === 0) {
      return res.status(400).json({ error: 'Offer letter PDF is required for internship.' })
    }
  }

  const previous =
    attemptCount > 0
      ? await PblSubmission.findOne({ submittedBy }).sort({ createdAt: -1 }).lean()
      : null

  const offerLetterPath = req.file
    ? path.join('uploads', 'offer-letters', req.file.filename).replaceAll('\\', '/')
    : previous?.offerLetterPath || null

  const record = await PblSubmission.create({
    submissionType,
    registrationId,
    name,
    pbl: submissionType === 'major-project' ? pbl : null,
    onlineLink: submissionType === 'major-project' ? onlineLink : null,
    githubRepo: submissionType === 'major-project' ? githubRepo : null,
    projectName: submissionType === 'major-project' ? projectName : null,
    companyName: submissionType === 'internship' ? companyName : null,
    domainJobProfile: submissionType === 'internship' ? domainJobProfile : null,
    internshipStartDate: submissionType === 'internship' ? internshipStartDate : null,
    internshipEndDate: submissionType === 'internship' ? internshipEndDate : null,
    offerLetterPath,
    submittedBy,
    submittedByRole: req.user.role,
    attemptNumber: attemptCount + 1,
  })

  return res.status(201).json({
    message: attemptCount === 0 ? 'PBL presentation submitted.' : 'PBL presentation resubmitted.',
    record,
    ...buildSubmissionStatus(attemptCount + 1),
  })
}

export async function getAssignedFacultyForStudent(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const assignedFacultyRegistrationNumber = req.user.assignedFacultyRegistrationNumber || null

  if (!assignedFacultyRegistrationNumber) {
    return res.json({ assignedFaculty: null })
  }

  const faculty = await UserProfile.findOne({
    registrationNumber: assignedFacultyRegistrationNumber,
    role: { $in: ['Faculty', 'Faculty Coordinator'] },
  }).lean()

  if (!faculty) {
    return res.json({ assignedFaculty: null })
  }

  return res.json({
    assignedFaculty: {
      name: faculty.name,
      registrationNumber: faculty.registrationNumber,
      email: faculty.email || null,
      phone: faculty.phone || null,
      department: faculty.department || null,
    },
  })
}

function quoteCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function exportPblPresentations(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const rows = await PblSubmission.find().sort({ createdAt: -1 }).lean()
  const headers = [
    'submissionType',
    'registrationId',
    'name',
    'pbl',
    'onlineLink',
    'githubRepo',
    'projectName',
    'companyName',
    'domainJobProfile',
    'internshipStartDate',
    'internshipEndDate',
    'offerLetterPath',
    'submittedBy',
    'submittedByRole',
    'attemptNumber',
    'createdAt',
  ]

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="pbl-presentation-responses.csv"')
  return res.send(csv)
}
