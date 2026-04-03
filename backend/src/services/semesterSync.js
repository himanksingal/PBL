import { UserProfile } from '../models/UserProfile.js'

export function computeSemester(enrollmentDate) {
  if (!enrollmentDate) return null
  const now = new Date()

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  const enrollYear = enrollmentDate.getFullYear()
  const enrollMonth = enrollmentDate.getMonth()

  let yearsDiff = currentYear - enrollYear

  // Base semesters: each full calendar year passed adds 2 semesters 
  let sems = yearsDiff * 2

  // Add odd/even semester based on current month
  // Jan (0) to June (5) -> Even semester (e.g. Sem 2 of that academic year)
  // Jul (6) to Dec (11) -> Odd semester (e.g. Sem 1 of that academic year)
  if (currentMonth >= 6) {
    sems += 1 // Odd semester
  }

  // Adjust if they enrolled in Spring (Jan-May) instead of Fall (July/Aug-Dec)
  if (enrollMonth < 6) {
    sems += 1 // Their 1st semester was Spring, so they started early
  }

  // Sanity floor/ceiling
  if (sems < 1) sems = 1
  return sems.toString()
}

export async function syncAllStudentSemesters() {
  try {
    const students = await UserProfile.find({ role: 'Student' })
    let updatedCount = 0

    for (const student of students) {
      if (!student.enrollmentDate) continue
      
      const expectedSem = computeSemester(student.enrollmentDate)
      if (expectedSem && student.semester !== expectedSem) {
        student.semester = expectedSem
        await student.save()
        updatedCount++
      }
    }

    if (updatedCount > 0) {
      console.log(`[Semester Sync] Updated semesters for ${updatedCount} students.`)
    } else {
      console.log(`[Semester Sync] All student semesters are up to date.`)
    }
  } catch (err) {
    console.error(`[Semester Sync] Error syncing semesters:`, err)
  }
}
