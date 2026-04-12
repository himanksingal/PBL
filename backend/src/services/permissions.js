export const rolePermissions = {
  student: ['view-project', 'submit-update', 'view-assessments'],
  faculty: ['view-student', 'remark'],
  'Faculty Coordinator': [
    'assign-guide',
    'assign-project',
    'broadcast',
    'set-assessments',
    'view-student',
    'remark',
  ],
  admin: [
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

