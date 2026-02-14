import path from 'node:path'
import { findExaminerByGuide } from '../services/studentData.js'
import { PblSubmission } from '../models/PblSubmission.js'
import { isDatabaseConnected } from '../config/db.js'

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

export function getExaminerByGuide(req, res) {
  const guideName = req.query.guideName || ''
  const result = findExaminerByGuide(guideName)

  if (!result) {
    return res.status(404).json({ error: 'No examiner mapping found for this guide.' })
  }

  return res.json(result)
}

export async function submitPblPresentation(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
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

    if (!req.file) {
      return res.status(400).json({ error: 'Offer letter PDF is required for internship.' })
    }
  }

  const offerLetterPath = req.file
    ? path.join('uploads', 'offer-letters', req.file.filename).replaceAll('\\', '/')
    : null

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
    submittedBy: req.user.id,
    submittedByRole: req.user.role,
  })

  return res.status(201).json({ message: 'PBL presentation submitted.', record })
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
