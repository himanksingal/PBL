import { isDatabaseConnected } from '../config/db.js'
import { UserProfile } from '../models/UserProfile.js'
import { ensureDb, parsePagination } from '../lib/helpers.js'



export async function listFacultyOptions(req, res) {
  if (!ensureDb(res)) return

  const search = String(req.query.search || '').trim()
  const { page, pageSize, skip } = parsePagination(req.query)

  const filter = {
    role: 'Faculty',
  }

  if (search) {
    const regex = new RegExp(search, 'i')
    filter.$or = [{ name: regex }, { registrationNumber: regex }, { department: regex }]
  }

  const [rows, total] = await Promise.all([
    UserProfile.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(pageSize)
      .select({ registrationNumber: 1, name: 1, role: 1, department: 1, _id: 0 })
      .lean(),
    UserProfile.countDocuments(filter),
  ])

  return res.json({
    faculties: rows.map((item) => ({
      registrationNumber: item.registrationNumber,
      name: item.name,
      role: item.role,
      department: item.department || null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

export async function listStudentOptions(req, res) {
  if (!ensureDb(res)) return

  const search = String(req.query.search || '').trim()
  const facultyRegistrationNumber = String(req.query.facultyRegistrationNumber || '').trim()
  const onlyAssignedTo = String(req.query.onlyAssignedTo || '').trim()
  const semester = String(req.query.semester || '').trim()
  const { page, pageSize, skip } = parsePagination(req.query)

  const filter = { role: 'Student' }

  if (semester) {
    filter.semester = semester
  }

  if (onlyAssignedTo) {
    filter.assignedFacultyRegistrationNumber = onlyAssignedTo
  }

  if (search) {
    const regex = new RegExp(search, 'i')
    filter.$or = [{ name: regex }, { registrationNumber: regex }, { department: regex }]
  }

  const [students, total] = await Promise.all([
    UserProfile.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(pageSize)
      .select({
        externalId: 1,
        registrationNumber: 1,
        name: 1,
        semester: 1,
        department: 1,
        assignedFacultyRegistrationNumber: 1,
        _id: 0,
      })
      .lean(),
    UserProfile.countDocuments(filter),
  ])

  // Resolve faculty names
  const assignedFacultyRegNumbers = [...new Set(students.map(s => s.assignedFacultyRegistrationNumber).filter(Boolean))]
  let facultyNamesMap = {}
  if (assignedFacultyRegNumbers.length > 0) {
    const faculties = await UserProfile.find({ registrationNumber: { $in: assignedFacultyRegNumbers } }).select({ registrationNumber: 1, name: 1 }).lean()
    for (const f of faculties) {
      facultyNamesMap[f.registrationNumber] = f.name
    }
  }

  return res.json({
    students: students.map((item) => {
      const assigned = item.assignedFacultyRegistrationNumber || null
      const id = item.registrationNumber || item.externalId
      return {
        id,
        registrationNumber: item.registrationNumber,
        name: item.name,
        semester: item.semester || null,
        department: item.department || null,
        assignedFacultyRegistrationNumber: assigned,
        assignedFacultyName: assigned ? (facultyNamesMap[assigned] || null) : null,
        selected: facultyRegistrationNumber ? assigned === facultyRegistrationNumber : false,
      }
    }),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  })
}

export async function assignStudentsToFaculty(req, res) {
  if (!ensureDb(res)) return

  const { facultyRegistrationNumber, studentRegistrationNumbers, studentIds } = req.body || {}

  if (!facultyRegistrationNumber) {
    return res.status(400).json({ error: 'facultyRegistrationNumber is required.' })
  }

  const inputIds = Array.isArray(studentRegistrationNumbers)
    ? studentRegistrationNumbers
    : Array.isArray(studentIds)
      ? studentIds
      : null

  if (!inputIds) {
    return res.status(400).json({ error: 'studentRegistrationNumbers or studentIds must be an array.' })
  }

  const faculty = await UserProfile.findOne({
    registrationNumber: facultyRegistrationNumber,
    role: 'Faculty',
  }).lean()

  if (!faculty) {
    return res.status(404).json({ error: 'Faculty not found.' })
  }

  const cleanIds = [...new Set(inputIds.map((item) => String(item).trim()).filter(Boolean))]

  await UserProfile.updateMany(
    {
      role: 'Student',
      assignedFacultyRegistrationNumber: facultyRegistrationNumber,
    },
    {
      $set: {
        assignedFacultyRegistrationNumber: null,
      },
    }
  )

  if (cleanIds.length > 0) {
    await UserProfile.updateMany(
      {
        role: 'Student',
        $or: [{ registrationNumber: { $in: cleanIds } }, { externalId: { $in: cleanIds } }],
      },
      {
        $set: {
          assignedFacultyRegistrationNumber: facultyRegistrationNumber,
        },
      }
    )
  }

  return res.json({
    message: 'Faculty-student assignment updated.',
    facultyRegistrationNumber,
    assignedCount: cleanIds.length,
  })
}
