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

