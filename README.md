# MUJ Minor Project Portal (MERN Monorepo)

This repository contains a MERN-based portal for Minor Projects with role-based access:
- Student
- Faculty
- Faculty Coordinator
- Master Admin

The project uses a monorepo structure:
- `backend/` for API + auth + database models
- `frontend/` for React app (Tailwind + shadcn)

---

## 1. Monorepo Structure

```text
PBL/
  backend/
    src/
      config/
      controllers/
      lib/
      middleware/
      models/
      routes/
      services/
  frontend/
    src/
      components/
      pages/
      lib/
  package.json
  package-lock.json
```

### Why root `package.json` and root `node_modules` exist
This repo uses **npm workspaces** (root `package.json` includes `frontend` and `backend` workspaces).

Root files and folder are used for workspace management:
- `package.json` (root): workspace config and shared scripts like `dev:frontend`, `dev:backend`
- `package-lock.json` (root): single lock file for both apps
- `node_modules/` (root): hoisted/shared dependencies managed by npm

Do not delete these if you are using workspace scripts.

---

## 2. Tech Stack

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- Cookie-based session with signed JWT
- Local auth (Mongo credentials) + Keycloak auth
- Multer for local file uploads (PDF)

### Frontend
- React + Vite
- Tailwind CSS
- Official shadcn setup (CLI initialized)
- Radix-based shadcn components

---

## 3. Roles and Access

### Student
- Find external examiner by guide name
- Submit PBL Presentation form
- **Maximum 2 submissions total** (1 submit + 1 final resubmit)

### Faculty Coordinator
- View assigned students
- View latest submitted form details and uploaded report path
- Export assigned student responses
- Export all student responses (coordinator-level)

### Faculty
- View assigned students
- View latest submitted form details and uploaded report path
- Export assigned student responses

### Master Admin
- Manage users (create/update/delete)
- Assign role, auth source, and assigned faculty registration number for students
- Force password reset for local users

---

## 4. Authentication Model

Two supported auth methods:
1. **Local auth via MongoDB credentials**
2. **Keycloak OIDC auth**

### Local auth data model
- `UserProfile` stores profile + role + academic metadata
- `LocalCredential` stores username/passwordHash and flags

`LocalCredential` links to user profile by:
- `userId` -> `UserProfile._id` (primary linking)
- `userExternalId` kept as temporary legacy fallback

### Password handling
- Uses `bcrypt`
- `mustResetPassword` flag forces first-login password reset flow

---

## 5. Important Backend Models

### `UserProfile`
Key fields:
- `externalId`
- `registrationNumber`
- `role`
- `name`
- `email`, `phone`
- `department`, `branch`, `semester`, `graduationYear`
- `assignedFacultyRegistrationNumber` (for student -> faculty assignment)

### `LocalCredential`
Key fields:
- `userId` (ObjectId ref to `UserProfile`)
- `username` (unique)
- `passwordHash`
- `mustResetPassword`
- `passwordUpdatedAt`

### `PblSubmission`
Key fields:
- student submission form payload
- `submittedBy`
- `attemptNumber` (1 or 2)

---

## 6. Backend API Overview

### Auth
- `POST /api/auth/login`
- `POST /api/auth/reset-first-login-password`
- `POST /api/auth/logout`
- `GET /api/auth/keycloak/login`
- `GET /api/auth/keycloak/callback`

### Profile
- `GET /api/profile` (protected)

### Student
- `GET /api/student/examiner?guideName=...`
- `GET /api/student/pbl-presentations/status`
- `POST /api/student/pbl-presentations`

### Faculty
- `GET /api/faculty/students`
- `GET /api/faculty/responses/export`
- `GET /api/faculty/responses/export-all`

### Admin
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`

---

## 7. Student Submission Rules

Implemented behavior:
- Attempt 1: normal submit
- Attempt 2: allowed as final resubmission
- After attempt 2: locked, no further edits/submits

UI behavior:
- Student sees status and attempt count
- After first submit, student gets a resubmit option
- Export button removed from student form page

---

## 8. Faculty Dashboard Behavior

Faculty dashboard shows:
- Assigned students based on `UserProfile.assignedFacultyRegistrationNumber === loggedInFacultyRegistrationNumber`
- Latest submission details per student
- Links for report (if uploaded) and web/repo links

Export capabilities:
- Faculty export: assigned students only
- Faculty Coordinator export: all student responses

---

## 9. Frontend Routing and Guards

- Unauthenticated users are redirected to `/login`
- Protected routes require valid session cookie
- Role-aware content:
  - Student -> Student dashboard and PBL flow
  - Faculty / Faculty Coordinator -> Faculty dashboard
  - Master Admin -> Admin home/manage
- Student-only route:
  - `/pbl-presentation` is restricted to Student role

---

## 10. shadcn Setup Status

Official shadcn setup has been initialized in `frontend`:
- `components.json`
- `src/lib/utils.js` (`cn` using `clsx` + `tailwind-merge`)
- shadcn component files in `src/components/ui/*`
- `@` alias configured in Vite and jsconfig

Design theme was mapped to existing orange/gray look to avoid UI drift.

---

## 11. Environment Setup

### Backend `.env` (example)
Create: `backend/.env`

```env
PORT=5001
HOST=localhost
NODE_ENV=development

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=muj_portal

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=muj
KEYCLOAK_CLIENT_ID=muj-portal-web
KEYCLOAK_CLIENT_SECRET=<client-secret>

COOKIE_SECURE=false
LOCAL_LOGIN_ENABLED=true
JWT_SECRET=<long-random-secret>
BCRYPT_ROUNDS=12

LOCAL_BOOTSTRAP_ADMIN_ID=ADMIN-0001
LOCAL_BOOTSTRAP_ADMIN_NAME=Master Admin
LOCAL_BOOTSTRAP_ADMIN_EMAIL=admin@muj.manipal.edu
LOCAL_BOOTSTRAP_ADMIN_PHONE=+91-9000000001
LOCAL_BOOTSTRAP_ADMIN_USERNAME=admin
LOCAL_BOOTSTRAP_ADMIN_PASSWORD=Admin@123
```

### Frontend `.env` (example)
Create: `frontend/.env`

```env
VITE_APP_NAME=MUJ Minor Project Portal
VITE_API_BASE_URL=http://localhost:5001
```

---

## 12. Run Commands

From repo root:

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

Build frontend:

```bash
npm run build:frontend
```

---

## 13. Assignment Data for Faculty View

For faculty dashboard to show student list, each student profile should have `assignedFacultyRegistrationNumber` set.

You can set it from Admin Manage Users form:
- For student records, fill `Assigned Faculty Registration No. (students)` with the faculty registration number.

---

## 14. File Uploads

Current upload storage:
- Local filesystem under `backend/uploads/offer-letters`

This is intended for development. You can later swap to S3 by abstracting storage in upload service/controller.

---

## 15. Beginner Workflow (Recommended)

1. Start backend and frontend.
2. Login as bootstrap admin.
3. Create faculty and student users.
4. For each student, set `assignedFacultyRegistrationNumber`.
5. Student submits PBL form (max two attempts).
6. Faculty reviews assigned submissions.
7. Faculty exports assigned responses.
8. Faculty Coordinator exports all responses.

---

## 16. Notes and Caveats

- If MongoDB is unreachable, DB-backed features fail.
- Local auth requires MongoDB (by design).
- Keycloak logout clears app cookies and can redirect to Keycloak end session.
- Keep `.env` out of version control.

---

## 17. Next Recommended Improvements

- Add pagination and server-side table filtering for faculty/admin lists.
- Add audit logs for create/update/delete and export actions.
- Add forgot-password flow (email OTP/reset token).
- Add tests for auth and submission-attempt logic.
- Add S3 adapter for uploads.

---

## 18. Local Data Dependencies (Replace Before Production)

The following still rely on local/static data:
- Venue & Panel Finder source data is static in `backend/src/services/studentData.js` (guide name, external examiner, panel, venue, date, slot).
- Template download is static in `frontend/public/templates/pbl-template.txt`.
- Uploaded offer letters are stored on local disk in `backend/uploads/offer-letters` (not S3 yet).
- Student dashboard panel has DB persistence now, but still has hardcoded fallback defaults used when DB is unavailable.

### Venue & Panel Finder MongoDB Integration Plan
1. Create `ExaminerAssignment` model in MongoDB with fields:
`guideRegistrationNumber`, `guideName`, `externalExaminerName`, `panelName`, `venue`, `evaluationDate`, `slot`.
2. Add indexes for `guideRegistrationNumber` and `guideName`.
3. Replace in-memory lookup in `findExaminerByGuide` with Mongoose query.
4. Add coordinator CRUD APIs to maintain these assignments.
5. Keep `GET /api/student/examiner` contract unchanged so frontend remains stable.

### Feature Additions For Production-Grade Product
- Full task management module (faculty creates tasks, students submit updates, faculty tracks status history).
- Bulk import for users/faculty mappings via CSV.
- Notification layer (email/SMS/WhatsApp) for deadlines and evaluation updates.
- Audit logging for admin/coordinator edits and assignment changes.
- File storage migration to S3 with signed URL access.
- Report generation and analytics by department/semester/faculty.
