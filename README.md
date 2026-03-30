# DR.LB College CampusConnect

CampusConnect is a college communication and academic management platform built for DR.LB College. It brings the most common campus workflows into one system so teachers and students do not have to depend on separate apps for notes, schedules, notices, registrations, directory access, and chat.

This project was designed as a role-based college app:

- Teachers can upload and manage academic content, review registrations, manage academic options, control student batch changes, create faculty updates, and moderate classroom workflows.
- Students can access only the tools and academic content relevant to their role and academic profile while still using social and communication features such as feed, chat, reels, and notifications.

## 1. Project Goals

The main goals of this project are:

- centralize communication between students and faculty
- digitize note sharing and schedule distribution
- reduce confusion in academic content visibility
- provide controlled student account management
- support NSS/NCC registration workflows
- create a modern college app experience with chat, feed, reels, and notifications

## 2. Main Modules

The app currently includes:

- `Home` - social feed, notices, reels, faculty text updates (`Typo`)
- `Chat` - real-time direct chat and teacher-created group chat
- `Schedule` - timetables, attendance files, and result files
- `Notes` - class-only and view-all notes repository
- `Internship` - internship posting and browsing
- `Registrations` - NSS and NCC enrolment + teacher review
- `Directory` - student/faculty directory with academic control tools
- `Notifications` - in-app notification center
- `Settings` - profile, preferences, notification settings
- `Profile` - view user information and related content

## 3. Tech Stack

- `Framework:` Next.js 15 (App Router)
- `Language:` TypeScript
- `UI:` React + ShadCN UI + Tailwind CSS
- `Database:` PostgreSQL
- `ORM:` Prisma
- `Authentication style:` app-managed login flow with role-based access
- `Realtime:` server-push stream for live chat and presence updates
- `PWA support:` next-pwa

## 4. Prerequisites

Before running the project, install the following on the target system:

- `Node.js` 20 LTS or newer
- `npm` (comes with Node.js)
- `PostgreSQL` 14 or newer
- `Git`

Recommended official downloads:

- Node.js: `https://nodejs.org/`
- PostgreSQL: `https://www.postgresql.org/download/`
- Git: `https://git-scm.com/downloads`

## 5. Get the Project

### Option A: Clone from GitHub

After uploading this project to GitHub, use:

```bash
git clone <your-github-repository-url>
cd bullayya
```

### Option B: Download ZIP

- Open the repository page in GitHub
- Click `Code`
- Click `Download ZIP`
- Extract the project folder
- Open the extracted folder in terminal

## 6. PostgreSQL Setup

Create a PostgreSQL database for the app.

Example using `psql`:

```sql
CREATE DATABASE drlb_campusconnect;
```

You can use the default `postgres` user or another PostgreSQL user with access to this database.

## 7. Environment Variables

Create a `.env` file in the project root, or copy from `.env.example`.

Example:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/drlb_campusconnect?schema=public"
WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:admin@example.com"
```

### Required

- `DATABASE_URL`

### Optional

- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`

Note:

- Web push settings are optional.
- The app can run without hardware/browser push.
- If you want browser push later, it must be tested in production mode with HTTPS.

## 8. Install Dependencies

Run:

```bash
npm install
```

The project automatically runs Prisma client generation during `postinstall`.

## 9. Prisma Setup

### Apply database migrations

For a fresh setup:

```bash
npx prisma migrate deploy
```

### Optional: generate Prisma client manually

```bash
npx prisma generate
```

### Optional: seed demo accounts

```bash
npx prisma db seed
```

Current seed accounts:

- `Teacher`
  - email: `teacher@gmail.com`
  - password: `bug`
- `Student`
  - email: `student@gmail.com`
  - password: `student123`

Teacher account creation inside the app currently requires the owner key:

- `337`

## 10. Run the Project

### Development mode

```bash
npm run dev
```

Important:

- Development server runs on port `9002`
- Open: `http://localhost:9002`

### Production build

```bash
npm run build
npm run start
```

Important:

- Production server starts on port `3000` by default
- Open: `http://localhost:3000`

## 11. First-Time Checklist

When handing the project to another teacher or technical person, ask them to do this in order:

1. Install Node.js
2. Install PostgreSQL
3. Clone or download the project
4. Create the database
5. Create `.env`
6. Run `npm install`
7. Run `npx prisma migrate deploy`
8. Optionally run `npx prisma db seed`
9. Run `npm run dev` or `npm run build && npm run start`

## 12. How to Modify the Project Later

This section is for the next developer, support person, or staff member who may continue this project later.

### 12.1 If you want to modify the app code

Most important source folders are:

- `src/app/(main)/home` - Home feed
- `src/app/(main)/chat` - Chat page
- `src/app/(main)/notes` - Notes page
- `src/app/(main)/schedule` - Schedule page
- `src/app/(main)/directory` - Directory and academic control
- `src/app/(main)/registrations` - NSS/NCC registration flow
- `src/app/(main)/internship` - Internship page
- `src/app/(main)/settings` - Settings page
- `src/app/api` - backend API routes
- `src/lib` - shared helpers and utilities

### Recommended code-edit workflow

1. open the project in VS Code or another editor
2. run the app in development mode

```bash
npm run dev
```

3. make the required code changes
4. save the files
5. test the affected page in the browser
6. when finished, verify with:

```bash
npm run build
```

7. if the build succeeds, commit and push the update

### 12.2 If you want to modify the database structure

If you want to add, remove, or change database fields or models:

1. edit:

```text
prisma/schema.prisma
```

2. create a new migration:

```bash
npx prisma migrate dev --name describe_your_change
```

Example:

```bash
npx prisma migrate dev --name add_teacher_status
```

3. Prisma will:

- create the migration
- update the local database
- regenerate Prisma client

4. after that, run:

```bash
npm run build
```

### 12.3 If you want to modify existing data, not structure

If you only want to change saved data and not the schema:

- use the app UI whenever possible
- do not directly edit database rows unless necessary

Examples:

- change courses / branches / sections / years:
  - use `Manage options`
- move students to a new batch:
  - use `Academic Control`
- upload notes or schedules:
  - use the Notes and Schedule pages

This is safer than direct database editing.

### 12.4 When direct database access may be needed

Direct PostgreSQL changes may be needed only for:

- backup or restore
- fixing broken rows
- removing bad test data
- advanced maintenance

If direct SQL changes are made:

1. take a backup first
2. make the change carefully
3. test the app after the change

### 12.5 If you add new environment variables

Whenever a new environment variable is introduced:

1. add it to `.env`
2. add it to `.env.example`
3. document it in `README.md`

This prevents future setup confusion.

### 12.6 If you change Prisma schema on the deployed server

On a deployed server, do not use:

```bash
npx prisma migrate dev
```

Instead use:

```bash
npx prisma migrate deploy
```

This is the safer deployment command for existing migrations.

### 12.7 If you add a new page or module

Recommended pattern:

1. create the page inside `src/app/(main)/...`
2. create or update the required API route in `src/app/api/...`
3. connect navigation if needed
4. test teacher/student access carefully
5. run `npm run build`

### 12.8 Before pushing future updates

Use:

```bash
git add .
git commit -m "Describe the update"
git push
```

Before pushing, confirm these are not committed:

- `.env`
- `.env.local`
- `node_modules`
- `.next`

## 13. Important Functional Rules

Some key rules already implemented in the project:

- Students must log in with their academic profile:
  - course
  - branch
  - section
  - year
- Schedule visibility is restricted to the student's own academic batch
- Notes support:
  - `Class only`
  - `View all`
- Teachers can manage academic options:
  - courses
  - branches
  - sections
  - years
- Teachers can promote students individually or in bulk
- Student academic updates are pending until the student accepts them
- Student-to-student direct chat is blocked
- Teacher-created groups are allowed
- Teachers can delete student accounts from the directory

## 14. Quick Feature Summary by Page

### Home

- teachers can create posts, notices, reels, and `Typo`
- students can view, like, comment, and share

### Chat

- real-time direct chat
- teacher-created group chat
- bulk message delete
- message delete rules for self and everyone

### Notes

- teachers upload notes
- students see only allowed notes
- supports class-based note visibility

### Schedule

- teachers upload timetable, attendance, and result files
- students see only their own batch schedule

### Directory

- view students and faculty
- teacher-only academic control
- teacher-only manage options
- teacher-only student promote/delete

### Registrations

- students submit NSS/NCC enrolment
- teachers review and approve or deny

## 15. Detailed Usage Guide

For the full teacher/student guide and page-by-page explanation, read:

- `USER_GUIDE.md`

## 16. Teacher and Student Page Use at a Glance

This section is intentionally short so a teacher can understand the system quickly without opening another file.

### Home

- `Teacher:` create posts, notices, reels, and `Typo` text updates
- `Student:` view, like, comment, and share

### Chat

- `Teacher:` direct chat, group creation, group management
- `Student:` direct chat with teachers, participation in teacher-created groups

### Schedule

- `Teacher:` upload timetable, attendance, and result files
- `Student:` view only the schedule files for the active academic batch

### Notes

- `Teacher:` upload notes and choose `Class only` or `View all`
- `Student:` view only allowed notes and search/filter them

### Internship

- `Teacher:` post internship opportunities
- `Student:` browse and open internship apply links

### Registrations

- `Teacher:` review and approve or deny NSS/NCC applications
- `Student:` submit NSS/NCC applications

### Directory

- `Teacher:` manage academic options, filter students, promote students, delete student accounts, use Academic Control
- `Student:` search people, open chat, and view profiles

### Notifications

- `Teacher:` monitor system events and workflow updates
- `Student:` track account-related updates and responses

### Settings

- `Teacher:` update profile and preferences
- `Student:` update profile and preferences, while academic identity remains controlled

## 17. Recommended Handoff Files

When sharing this project with the college, provide:

- source code repository link
- `README.md`
- `USER_GUIDE.md`
- `.env.example`

Optional but helpful:

- sample screenshots
- deployment note
- backup/export copy of the project

## 18. Troubleshooting

### Problem: `DATABASE_URL is not set`

Fix:

- create `.env`
- add valid PostgreSQL connection string

### Problem: `Could not find a production build in the .next directory`

Fix:

```bash
npm run build
npm run start
```

### Problem: Port `9002` already in use

Fix:

- stop the conflicting process
- or change the dev script port temporarily

### Problem: Prisma client error

Fix:

```bash
npx prisma generate
```

### Problem: Database tables are missing

Fix:

```bash
npx prisma migrate deploy
```

### Problem: Hardware/browser push is not working

Important:

- Push requires production mode
- Push requires HTTPS
- Push is not guaranteed in plain localhost/LAN HTTP testing

## 19. Suggested GitHub Repository Description

You can use this short description when publishing:

`A role-based college campus app for DR.LB College with notes, schedules, chat, registrations, directory management, and academic control workflows.`

## 20. Future Enhancements

Possible future improvements:

- AI study assistant for note and teacher recommendation
- stronger deployment guide for college server
- production-grade web push setup with HTTPS
- more admin analytics and reporting
- stronger audit logs for teacher actions

## 21. Contact / Ownership Note

This project was created as an academic college management and campus communication solution. Before running it on a shared institutional server, it is recommended to review:

- environment configuration
- database backup policy
- file upload storage path
- production HTTPS setup

---

If this repository is shared with teachers through GitHub, they can use this README as the complete setup and run guide, and `USER_GUIDE.md` as the full usage manual.
