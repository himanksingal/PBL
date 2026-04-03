import { PblSubmission } from '../models/PblSubmission.js'
import { UserProfile } from '../models/UserProfile.js'
import { isDatabaseConnected } from '../config/db.js'
import { parsePagination, toCsv } from '../lib/helpers.js'

function mapStudentItem(student, submissions) {
  const latest = submissions[0] || null
  return {
    student: {
      id: student.registrationNumber || student.externalId,
      name: student.name,
      semester: student.semester,
      graduationYear: student.graduationYear,
      department: student.department,
      email: student.email,
      phone: student.phone,
    },
    submissions,
    latestSubmission: latest,
    submissionCount: submissions.length,
  }
}

async function buildAssignedStudentPayload(user, semesterFilter = null) {
  const query = { role: 'Student' }
  
  if (user.role === 'Faculty') {
    const facultyProfile = await UserProfile.findOne({ externalId: user.id }).lean()
    const facultyRegistrationNumber = facultyProfile?.registrationNumber || user.id
    query.assignedFacultyRegistrationNumber = facultyRegistrationNumber
  }
  
  if (semesterFilter) query.semester = String(semesterFilter).trim()

  const students = await UserProfile.find(query).lean()
  const studentIds = [
    ...new Set(
      students
        .flatMap((student) => [student.registrationNumber, student.externalId])
        .filter(Boolean)
    ),
  ]
  const allSubmissions = await PblSubmission.find({ submittedBy: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .lean()

  const byStudent = new Map()
  studentIds.forEach((id) => byStudent.set(id, []))
  allSubmissions.forEach((item) => {
    if (byStudent.has(item.submittedBy)) {
      byStudent.get(item.submittedBy).push(item)
    }
  })

  return students.map((student) => {
    const submissions = [
      ...(byStudent.get(student.registrationNumber) || []),
      ...(byStudent.get(student.externalId) || []),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return mapStudentItem(student, submissions)
  })
}

export async function getAssignedStudentsWithSubmissions(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const { page, pageSize, skip } = parsePagination(req.query)
  const semesterFilter = req.query.semester || null
  const allRows = await buildAssignedStudentPayload(req.user, semesterFilter)
  const rows = allRows.slice(skip, skip + pageSize)
  return res.json({
    rows,
    pagination: {
      page,
      pageSize,
      total: allRows.length,
      totalPages: Math.max(1, Math.ceil(allRows.length / pageSize)),
    },
  })
}

export async function exportAssignedStudentResponses(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  const semesterFilter = req.query.semester || null
  const rows = await buildAssignedStudentPayload(req.user, semesterFilter)
  const flat = rows
    .filter((item) => item.latestSubmission)
    .map((item) => ({
      facultyRegistrationNumber: req.user.registrationNumber || req.user.id,
      studentId: item.student.id,
      studentName: item.student.name,
      semester: item.student.semester,
      department: item.student.department,
      submissionType: item.latestSubmission.submissionType,
      pbl: item.latestSubmission.pbl,
      projectName: item.latestSubmission.projectName,
      githubRepo: item.latestSubmission.githubRepo,
      onlineLink: item.latestSubmission.onlineLink,
      companyName: item.latestSubmission.companyName,
      domainJobProfile: item.latestSubmission.domainJobProfile,
      offerLetterPath: item.latestSubmission.offerLetterPath,
      attemptNumber: item.latestSubmission.attemptNumber,
      updatedAt: item.latestSubmission.createdAt,
    }))

  const headers = [
    'facultyRegistrationNumber',
    'studentId',
    'studentName',
    'semester',
    'department',
    'submissionType',
    'pbl',
    'projectName',
    'githubRepo',
    'onlineLink',
    'companyName',
    'domainJobProfile',
    'offerLetterPath',
    'attemptNumber',
    'updatedAt',
  ]

  const csv = toCsv(headers, flat)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="assigned-student-responses.csv"')
  return res.send(csv)
}

export async function exportAllStudentResponses(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }

  if (!req.user.isCoordinator) {
    return res.status(403).json({ error: 'Only Faculty Coordinators can configure milestones' })
  }

  const submissions = await PblSubmission.find().sort({ createdAt: -1 }).lean()

  const headers = [
    'submittedBy',
    'submissionType',
    'registrationId',
    'name',
    'pbl',
    'projectName',
    'githubRepo',
    'onlineLink',
    'companyName',
    'domainJobProfile',
    'offerLetterPath',
    'attemptNumber',
    'createdAt',
  ]

  const csv = toCsv(headers, submissions)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="all-student-responses.csv"')
  return res.send(csv)
}

export async function grantPblResubmit(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected. Configure MongoDB Atlas first.' })
  }
  
  try {
    const { studentId } = req.body
    const latest = await PblSubmission.findOne({ submittedBy: studentId }).sort({ createdAt: -1 })
    if (!latest) return res.status(404).json({ error: 'No submission found for this student.' })
    
    latest.resubmitGranted = true
    await latest.save()
    
    return res.json({ message: 'Resubmit granted successfully. The student can now unlock their form.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to grant resubmit', details: err.message })
  }
}

export async function editPblSubmission(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ error: 'Database is not connected.' })
  }
  
  try {
    const { id } = req.params
    const updateData = req.body
    
    const record = await PblSubmission.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    
    if (!record) return res.status(404).json({ error: 'Submission not found' })
    
    return res.json({ message: 'Submission updated successfully', record })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update submission', details: err.message })
  }
}
