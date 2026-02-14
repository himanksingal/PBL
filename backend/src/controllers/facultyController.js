import { PblSubmission } from '../models/PblSubmission.js'
import { UserProfile } from '../models/UserProfile.js'
import { isDatabaseConnected } from '../config/db.js'

function quoteCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function toCsv(headers, rows) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(',')),
  ].join('\n')
}

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

function parsePagination(query, fallbackPageSize = 10, maxPageSize = 100) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(query.pageSize) || fallbackPageSize))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

async function buildAssignedStudentPayload(facultyId) {
  const facultyProfile = await UserProfile.findOne({ externalId: facultyId }).lean()
  const facultyRegistrationNumber = facultyProfile?.registrationNumber || facultyId
  const students = await UserProfile.find({
    role: 'Student',
    assignedFacultyRegistrationNumber: facultyRegistrationNumber,
  }).lean()
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
  const allRows = await buildAssignedStudentPayload(req.user.id)
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

  const rows = await buildAssignedStudentPayload(req.user.id)
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

  if (req.user.role !== 'Faculty Coordinator') {
    return res.status(403).json({ error: 'Only faculty coordinator can export all responses.' })
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
