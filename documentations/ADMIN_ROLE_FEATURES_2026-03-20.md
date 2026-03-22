# Admin Role Features - Detailed Implementation

**Date:** 2026-03-20
**Time:** 11:35:00

## Scope of this update
This document records all Admin-role specific behavior implemented in this change set, including profile restrictions, dashboard modules, assigned-student CRUD behavior, year-wise access control, and year-wise listing behavior for counseling print workflows.

## 1) Admin Profile Section (restricted fields)
Admin profile UI now exposes only these editable profile fields:
1. Name
2. Department
3. Mobile Number
4. Date of Birth
5. Profile Image

### Frontend behavior
- File: `frontend/src/pages/Profile.jsx`
- Added a dedicated `if (userRole === 'admin')` render branch.
- Admin sees a focused form similar to superadmin style but strictly scoped to required fields.
- Email remains read-only and bound to account identity.
- Edit/Save/Cancel lifecycle:
  - `Edit Profile` unlocks allowed fields.
  - `Save Profile` calls existing `/api/profile` POST/PATCH flow.
  - `Cancel` restores persisted profile values.

## 2) Admin Dashboard modules
Dashboard buttons are now aligned with requested modules and routing:
1. Manage Students -> `/admin/users`
2. Mentor Grading -> `/mentorgrade`
3. Semester Marks -> `/semester`
4. Attendance -> `/attendance`
5. Access Control -> `/admin/access-window`
6. Counseling Forms -> `/admin/data-overview`
7. All Batches -> `/admin/batches`

### Frontend behavior
- File: `frontend/src/admin/pages/AdminPanel.jsx`
- Button labels and descriptions updated to reflect assigned-student scope and year-wise behavior.
- Added a dedicated `All Batches` card and route navigation.

## 3) Manage Students - CRUD for assigned students only
### Assignment rule on create
- File: `backend/routes/admin.js`
- Route: `POST /api/admin/users`
- Change:
  - If creator is `admin`, new student is auto-assigned to `req.user._id` via `assignedMentor`.
  - This ensures immediate mentor ownership and visibility in admin-scoped lists.

### Already assigned conflict handling
- File: `backend/routes/admin.js`
- Route: `POST /api/admin/users`
- Change:
  - If a matching student already exists, API now returns structured assignment-aware error.
  - Error includes assignment information when the student is assigned to another mentor/admin.
                                                                          
### Bulk smart-create assignment
- File: `backend/routes/admin.js`
- Route: `POST /api/admin/users/smart-create`
- Change:
  - For `admin`, created students are auto-assigned to that admin.
  - Skipped records include reason text such as `Already assigned to <mentor>`.

### Assigned-only visibility and destructive actions
- Existing routes already enforce admin scope by `assignedMentor = req.user._id` for list/delete paths.
- CRUD now consistently follows same ownership model from creation to deletion.

## 4) Access Control - year-wise login window (1/2/3/4)
### Backend data model
- File: `backend/models/SystemSettings.js`
- Added `studentLoginWindowsByYear` with year buckets:
  - `year1`, `year2`, `year3`, `year4`
  - each holds `{ enabled, startAt, endAt }`
  - plus audit metadata `{ updatedBy, updatedAt }`

### Backend APIs
- File: `backend/routes/admin.js`
- Added:
  - `GET /api/admin/student-login-windows`
    - Returns 4 year rows with current status and open/closed calculation.
    - Returns assigned student counts by year for current admin.
  - `PUT /api/admin/student-login-windows`
    - Accepts year-wise payload.
    - Validates datetime ranges when enabled.
    - Persists settings.
    - Optional `notifyStudents` flag sends emails to assigned students of enabled years.

### Login enforcement
- File: `backend/routes/auth.js`
- Route: `POST /api/auth/signin`
- Behavior for `role === 'user'`:
  - Detect student year (`user.yearOfStudy`).
  - If that year window is enabled, allow login only if current time is within start/end.
  - Otherwise block with 403 and clear window detail message.

### Email notifications
- File: `backend/routes/admin.js`
- In `PUT /api/admin/student-login-windows`:
  - For assigned students in enabled years, sends email containing:
    - Year number
    - Start timestamp
    - End timestamp
    - Dashboard login link

## 5) Access Control UI (year-wise)
### Frontend screen behavior
- File: `frontend/src/admin/pages/AdminAccessControl.jsx`
- Rebuilt to manage all 4 year windows in one page.
- For each year row:
  - Enable toggle
  - Start datetime
  - End datetime
  - Live status indicator (OPEN/CLOSED)
  - Assigned student count display
- Global option:
  - `Send email notification to all assigned students for enabled years`
- Save action uses:
  - `PUT /api/admin/student-login-windows`

## 6) Year-wise listing behavior (1,2,3,4)
### Admin data overview/all batches
- File: `frontend/src/admin/pages/AdminDataOverview.jsx`
- Updated filter model to fixed year buttons:
  - `All Batches`, `1st Year`, `2nd Year`, `3rd Year`, `4th Year`
- Year calculation is rank-based from admission prefixes.
- Data remains restricted to assigned students by backend API scope.

### Route for all batches
- File: `frontend/src/App.jsx`
- Added route:
  - `/admin/batches` -> `AdminDataOverview`

## 7) API summary for this update
1. `POST /api/admin/users`
  - Admin-created users auto-assigned to admin.
  - Assignment-aware conflict message.
2. `POST /api/admin/users/smart-create`
  - Admin bulk-created users auto-assigned to admin.
  - Skips include assignment reason.
3. `GET /api/admin/student-login-windows`
  - Returns year-wise login settings + assigned counts.
4. `PUT /api/admin/student-login-windows`
  - Saves year-wise windows and optionally notifies students.
5. `POST /api/auth/signin`
  - Student login denied outside active enabled window for their year.

## 8) Operational notes
- SMTP credentials must be configured for email dispatch:
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
- Frontend login link resolves via:
  - `FRONTEND_URL` (fallback to local URL)
- If windows are disabled for a year, login behaves as open for that year.

## 9) Files changed in this implementation
- `backend/models/SystemSettings.js`
- `backend/routes/auth.js`
- `backend/routes/admin.js`
- `frontend/src/admin/pages/AdminAccessControl.jsx`
- `frontend/src/admin/pages/AdminPanel.jsx`
- `frontend/src/admin/pages/AdminDataOverview.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/App.jsx`

## 10) Unified All Batches (Admin/Superadmin/Principal/Master)
### Requirement implemented
- The `All Batches` section now opens the same page for all four roles.
- Admin data visibility is restricted to only students assigned to that admin.

### Shared frontend page
- File: `frontend/src/admin/components/SuperAdminBatches.jsx`
- This component is now role-aware and used as the common all-batches UI.
- Back button destination is dynamic by role:
  - admin -> `/admin-panel`
  - superadmin -> `/superadmin-panel`
  - principal -> `/principal-panel`
  - master -> `/master-panel`
- UI now includes clickable batch cards for previous batches.
- Clicking a batch card opens that batch's student table.
- The student table remains role-scoped by backend permissions:
  - Admin: assigned students only
  - Other higher roles: all students visible in their role scope

### Shared route
- File: `frontend/src/App.jsx`
- Added unified route:
  - `/all-batches` -> shared all-batches component
- Role aliases retained:
  - `/admin/batches` -> shared component
  - `/superadmin/batches` -> shared component

### Role card navigation updates
- Files:
  - `frontend/src/admin/pages/AdminPanel.jsx`
  - `frontend/src/admin/pages/SuperAdminPanel.jsx`
  - `frontend/src/admin/pages/PrincipalPanel.jsx`
  - `frontend/src/admin/pages/MasterPanel.jsx`
- All `All Batches` cards now navigate to `/all-batches`.

### Shared backend API (role-aware filtering)
- File: `backend/routes/admin.js`
- Added endpoint:
  - `GET /api/admin/all-batches-students`
- Response is role-scoped:
  - `admin`: only students where `assignedMentor = req.user._id`
  - `superadmin`: only students in `req.user.departmentId`
  - `principal/master`: all active students
- Includes merged profile payload for each student for uniform rendering in all-batches table.

## 11) Semester Marks and Attendance display for students
### Semester marks page behavior
- File: `frontend/src/pages/MarksTable.jsx`
- For roles `admin/superadmin/principal/master`:
  - Page now loads students list from `/api/admin/users?role=user`.
  - Shows a student selector dropdown.
  - Displays marks of selected student.
  - Supports direct route open with email parameter (`/semester/:email`).
- For role `user`:
  - Page still loads own marks using own email context.

### Attendance page behavior
- File: `frontend/src/pages/Attendance.jsx`
- Manager roles already use student selector and show attendance of selected student.
- Admin sees only assigned students because source list comes from role-scoped `/api/admin/users?role=user`.
