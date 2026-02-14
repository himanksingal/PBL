export const roles = ['Student', 'Faculty', 'Faculty Coordinator', 'Master Admin']

export const rolePermissions = {
  Student: ['view-project', 'submit-update', 'view-assessments'],
  Faculty: ['view-student', 'remark'],
  'Faculty Coordinator': [
    'assign-guide',
    'assign-project',
    'broadcast',
    'set-assessments',
    'view-student',
    'remark',
  ],
  'Master Admin': [
    'assign-guide',
    'assign-project',
    'broadcast',
    'set-assessments',
    'view-student',
    'remark',
    'dept-analytics',
    'manage-users',
  ],
}

export const localAuthUsers = [
  {
    username: 'student.demo',
    password: 'Student@123',
    profile: {
      id: 'STU-23FE10CSE00539',
      name: 'Student Demo',
      email: 'student.demo@muj.manipal.edu',
      phone: '+91-9876543210',
      department: 'DOCSE',
      branch: 'Computer Science & Engineering',
      semester: 'VI',
      graduationYear: '2027',
      role: 'Student',
    },
  },
  {
    username: 'faculty.demo',
    password: 'Faculty@123',
    profile: {
      id: 'FAC-COORD-1102',
      name: 'Faculty Coordinator',
      email: 'faculty.coordinator@muj.manipal.edu',
      phone: '+91-9000000110',
      department: 'DOCSE',
      branch: 'Computer Science & Engineering',
      semester: '-',
      graduationYear: '-',
      role: 'Faculty Coordinator',
    },
  },
  {
    username: 'admin.demo',
    password: 'Admin@123',
    profile: {
      id: 'ADMIN-0001',
      name: 'Master Admin',
      email: 'admin@muj.manipal.edu',
      phone: '+91-9000000001',
      department: 'Academic Office',
      branch: 'Administration',
      semester: '-',
      graduationYear: '-',
      role: 'Master Admin',
    },
  },
]
