# CampusConnect User Guide

This guide explains how teachers and students should use the DR.LB College CampusConnect application.

It is written for two audiences:

- teachers and college staff using the system
- technical or support persons helping with setup and usage

## 1. Roles in the System

There are two main account types:

- `Student`
- `Teacher`

Teachers have broader control over academic workflows and management actions. Students mainly use the platform for learning, communication, and submitting applications.

## 2. Login and Account Rules

### Student account

Students log in with:

- email
- password
- course
- branch
- section
- year / semester

Important:

- student academic identity is part of the login flow
- student academic details are fixed after account creation
- if a teacher updates the student's batch, the student will see an academic update prompt

### Teacher account

Teachers log in with:

- email
- password

Teacher signup requires the owner key:

- `337`

## 3. Teacher and Student Access Summary

### Students can:

- view home feed content
- view reels
- chat with teachers
- participate in teacher-created group chats
- view their own schedule
- view allowed notes
- apply for NSS and NCC
- browse internship posts
- search the directory
- manage personal settings and profile

### Students cannot:

- create teacher-only academic content
- upload schedules
- manage academic options
- promote other accounts
- create student-to-student direct chats
- create groups

### Teachers can:

- create posts, notices, reels, and typo updates
- upload notes
- upload schedules
- manage academic options
- promote students individually or in bulk
- delete student accounts
- review NSS and NCC applications
- post internships
- create and manage group chats

## 4. Page-by-Page Guide

## 4.1 Home Page

### Purpose

The Home page is the main social and information feed of the app.

### Teacher usage

Teachers can:

- create media posts
- create notices
- create reels
- create text-only faculty updates using `Typo`
- like and comment on posts
- delete their own content
- share feed items to chat

### Student usage

Students can:

- view posts and notices
- like posts
- comment on posts
- share content to chat

### Expected use

- use Home for announcements, updates, campus engagement, and content sharing

## 4.2 Reels Page

### Purpose

The Reels page displays short-form video content.

### Teacher usage

Teachers can:

- upload reels through the Home creation flow
- view, like, and comment on reels

### Student usage

Students can:

- view reels
- like reels
- comment on reels

## 4.3 Chat Page

### Purpose

The Chat page supports communication between teachers and students.

### Teacher usage

Teachers can:

- chat directly with students
- chat directly with other teachers
- create groups
- add members to groups
- manage group settings
- delete their own messages
- bulk delete selected messages

### Student usage

Students can:

- chat directly with teachers
- participate in teacher-created groups
- delete messages from their own view

### Important rules

- student-to-student direct chat is blocked
- teacher-created groups are allowed
- real-time message updates are enabled inside the app
- message deletion supports:
  - delete for me
  - delete for everyone (only in valid self-sent cases)

## 4.4 Schedule Page

### Purpose

The Schedule page stores:

- timetable files
- attendance files
- exam result files

### Teacher usage

Teachers can:

- upload schedule-related files
- select course, branch, section, and year while uploading
- manage academic options
- replace or update class files

### Student usage

Students can:

- view only the files for their own batch
- not manually browse other classes

### Important rule

Schedule access is automatically scoped to the student's academic profile.

## 4.5 Notes Page

### Purpose

The Notes page acts as a digital notes repository.

### Teacher usage

Teachers can:

- upload notes
- choose note visibility:
  - `Class only`
  - `View all`
- manage academic options
- filter notes by academic fields and subject

### Student usage

Students can:

- view notes for their own class
- view notes marked `View all`
- search and filter allowed notes

### Important rule

Notes obey academic visibility rules, so restricted class notes are not shown to unrelated students.

## 4.6 Internship Page

### Purpose

The Internship page is used to share internship opportunities.

### Teacher usage

Teachers can:

- post internships
- add company, title, description, location, and application link
- delete their own internship posts

### Student usage

Students can:

- browse internship opportunities
- search internships
- open the application link

## 4.7 Registrations Page

### Purpose

This page manages NSS and NCC enrolment flows.

### Student usage

Students can:

- submit NSS enrolment
- submit NCC enrolment
- download their NCC form where applicable

### Teacher usage

Teachers can:

- review student applications
- approve applications
- deny applications

### Important rule

Only teachers can access the review workflow.

## 4.8 Directory Page

### Purpose

The Directory page helps users find students and teachers.

### Student usage

Students can:

- search directory members
- view profiles
- open chat with allowed users

### Teacher usage

Teachers can:

- search directory members
- use academic filters
- manage academic options
- open Academic Control
- send student promotion updates
- delete student accounts

### Academic Control features

Teachers can:

- preview a full batch
- move a full batch to a new course, branch, section, or year
- promote one student individually
- send pending academic updates

### Important rule

Delete confirmation in option management shows how many registered accounts are linked to the option before deletion.

## 4.9 Notifications Page

### Purpose

The Notifications page shows in-app alerts generated by system actions.

### Examples

- new comments
- likes
- notes or schedule updates
- registrations review results
- academic update related events

### Teacher and student usage

Both roles can:

- open the notification center
- read notifications
- track activity related to their account

## 4.10 Profile Page

### Purpose

The Profile page shows public user information.

### Available information

- user avatar
- name
- role
- academic summary for students
- related content and profile details

### Usage

- directory and chat can link into profile view

## 4.11 Settings Page

### Purpose

The Settings page lets users manage profile and notification preferences.

### Common settings

- profile image
- bio
- theme and appearance
- notification preferences

### Student-specific behavior

Students can view their academic profile in read-only form.

### Teacher-specific behavior

Teachers can manage account preferences and notification settings like any other user.

### Note about hardware/browser push

Push-related settings are present, but production HTTPS and browser support are required for real push-notification testing.

## 5. Academic Identity and Promotion Flow

This is one of the most important workflows in the project.

### Student account creation

When a student creates an account, the following must be selected:

- course
- branch
- section
- year

### After creation

- these values become the student's active academic profile
- students cannot freely change them from settings

### When a teacher promotes a student

Teachers can update a student or batch to a new academic profile.

The system behavior is:

1. old academic profile continues temporarily
2. student logs in using the previous active profile
3. student sees a pending academic update prompt
4. student taps update and continue
5. new academic profile becomes active

This makes the promotion process visible and controlled.

## 6. Content Visibility Rules

### Schedule

- strictly visible to the student's own academic profile

### Notes

- `Class only` notes are visible only to matching students
- `View all` notes are visible to everyone

### Home and social content

- generally visible according to the main feed rules

## 7. Suggested Demo Flow for Teachers

If the college wants a live demonstration, use this order:

1. log in as teacher
2. open Home and create a `Typo` update
3. open Notes and upload:
   - one `Class only` note
   - one `View all` note
4. open Schedule and upload a timetable
5. open Directory
6. show `Manage options`
7. show `Academic Control`
8. promote one student
9. log in as student
10. show the academic update prompt
11. open Notes and Schedule to show restricted visibility
12. open Chat to show real-time communication

## 8. Operational Notes for Teachers

- Use `Manage options` carefully, because deleting an academic option can affect linked student accounts.
- Use `Academic Control` when moving students between batches.
- Use `Class only` notes for controlled classroom material.
- Use `View all` for general reference material.
- Use group chats for classroom groups or teacher-managed discussions.

## 9. Recommended Support Notes

If the app is handed over internally, the following should also be documented by the college:

- who manages the PostgreSQL database
- who manages backups
- who controls teacher account creation
- who stores the owner key securely
- who handles deployment updates

## 10. Conclusion

CampusConnect is not just a content-sharing app. It combines:

- academic management
- student-teacher communication
- controlled content visibility
- institutional workflows

This user guide should be shared along with `README.md` so the system can be understood both functionally and technically.
