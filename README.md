# PUNDANA — Final local project

Independent IMS566 student project. Inspired by UiTM; not an official UiTM service.

## Run with Laragon

The working project folder is:

`C:\laragon\www\Pundana ACADIFY\pundana`

1. Open **Laragon** and click **Start All**. Keep Laragon running while you use PUNDANA.
2. In your browser, open [PUNDANA on localhost](http://localhost/Pundana%20ACADIFY/pundana/index.html).
3. Register a demo account if this is your first visit at this address, then sign in.
4. To edit the project, open the folder above in **Visual Studio Code**. Save your changes and refresh the browser. Press **Ctrl + F5** if an older layout is still displayed.
5. When finished, you can stop the services in Laragon.

Laragon serves the HTML, Bootstrap, CSS and JavaScript files. PUNDANA currently uses browser storage rather than a database, so no database creation, SQL import, PHP setup, build command or dependency installation is required. Bootstrap 5.3.3 CSS and the campus photograph are bundled locally.

Live Server is not required for this setup. Avoid opening index.html directly from File Explorer; use the localhost address above so authentication and browser storage work consistently.

## Update or back up the project

Keep a backup ZIP of your project folder. When applying an update, copy the files into the working pundana folder and replace matching files; do not place a second pundana folder inside it. Refresh the browser after updating.

Accounts and academic records are stored in the browser, not in the source folder or Laragon database. Replacing source files does not clear them, but a folder backup does not include them. Use the same browser, hostname and port to access existing records.

The previous Live Server address and the Laragon localhost address use separate browser storage. If you moved to Laragon, register a demo account there; records from Live Server are not transferred automatically.

## Vue.js Assignment Tracker

Assignment Tracker uses the locally bundled Vue.js 3.5.24 runtime, alongside the existing Bootstrap 5 styling. Vue manages the assignment form, search and status/subject filters with `v-model`, renders rows with `v-for`, and calculates filtered records and summary cards using computed properties. Add, edit and delete actions use the shared per-account browser storage, so Dashboard and Calendar continue to use the same assignments.

Implementation: `assets/js/assignments-vue.js`; page template: `assignments.html`; local runtime and license: `assets/vendor/vue.global.prod.js` and `Vue-LICENSE.txt`. No npm, build step or internet connection is needed to run the page. Subjects and other pages retain their existing scripts.

To test: sign in as `lecturer` with password `Pundana123`, open Assignment Tracker, search for Literature, try subject/status filters, then add a temporary assignment. Edit its status and check the Dashboard summary; cancel deletion once, then delete the temporary record. Reload to confirm persistence. The lecturer demo includes the three supplied real assignments. Use the same browser and localhost address to retain changes.

## Available pages
- Login and Registration: validation, salted password hashes, browser-only sign-in, optional remembered sessions and sign-out.
- Dashboard: saved subject totals, credits, assignment progress, deadlines and today's classes. Its class-semester selector limits class totals and sessions to the selected semester. Subject/assignment totals still include all stored records. Sample preview uses separate fictional data in memory only.
- My Subjects: add, edit, delete, search and semester filter; duplicate subject codes prevented per semester; linked records prevent deletion.
- Assignment Tracker: add, edit, delete, search, subject/status filters and automatic dashboard integration.
- Class Timetable: weekly and daily views, semester selection, today highlight, subject colours, add/edit/delete sessions, inherited lecturer information and overlap prevention.
- Academic Performance: select a semester, enter subject grades, view weighted semester GPA and combine with a saved previous record to estimate CGPA.
- Academic Calendar: month navigation, date selection, event-type filters, linked assignment deadlines and add/edit/delete custom events.
- Student Profile: view and edit name, email, programme, faculty and semester; fixed student ID; live account statistics.

## Test the timetable
1. With your Semester 4 subjects saved, open Class Timetable and click Add class.
2. Select a subject, choose today's weekday, set 09:00–11:00, and enter a sample location such as Lab 2. Save.
3. The weekly view should show the class; the dashboard should show it under today's classes when Semester 4 is selected.
4. Try a second subject in the same semester at 10:00–12:00 on the same day. A conflict should prevent saving. Change it to 11:00–12:00: back-to-back classes should save.
5. Switch between weekly and daily views, edit a class, cancel a deletion, and reload to check persistence.

Conflicts are checked across subjects within the same semester, including when moving a subject into another semester. Historical semesters may reuse the same times. Classes recur weekly without start/end dates; times use your device's local timezone and sessions must finish the same day.

## Test academic performance
1. Open Academic Performance and select Semester 4.
2. Choose grades for your subjects. Each change saves immediately. Not graded removes the grade and excludes the subject's credits from GPA; F includes the credits with zero points.
3. For three subjects worth 2 credits each, grades A, B and C should give GPA 3.00 (18 weighted points divided by 6 graded credits).
4. Enter previous CGPA 3.50 and 45 previous GPA credit hours, then Save previous record. With those example grades, estimated CGPA should display 3.44 ((3.50 × 45 + 18) / 51).
5. Refresh to confirm grades/history persist. Switch semesters to confirm their grades and previous records remain separate.

For a first semester, enter 0 for previous CGPA and credits. Previous GPA credits are the credits included in your prior CGPA, including failed courses counted there; do not include the selected semester again. Untouched previous-record fields are blank, and no CGPA is displayed until a baseline is saved. Incomplete grades produce provisional estimates. Changing a subject's credits recalculates its weighted contribution.

The point scale is referenced to the UiTM CEEE210 Student Handbook, Table 5.1 (PDF page 24): https://penang.uitm.edu.my/images/fke/dokumen/STUDENTS_HANDBOOK.pdf#page=24. See docs/grade-reference.md. Repeats, exemptions, transfer credits and special academic-status rules are outside this simple personal estimate. The app does not issue official results or academic standing decisions.

## Source files
- index.html / register.html: authentication pages
- dashboard.html: academic overview
- subjects.html / assignments.html: academic records
- timetable.html / performance.html: timetable and grade planning pages
- assets/css/: editable theme and page layouts; Bootstrap remains in assets/vendor/
- assets/js/auth.js: demo account and session handling
- assets/js/dashboard-data.js: shared existing academic data and subject/assignment operations
- assets/js/academic-tools.js: class validation, overlap checks, grade/history writes and GPA/CGPA formulas
- assets/js/workspace.js: shared session guard, navigation and page helpers
- assets/js/timetable.js / performance.js: timetable and performance behavior
- assets/js/academic.js / dashboard.js: existing page behavior
- assets/images/uitm-puncak-perdana.png: original photograph supplied by the project owner
- tests/timetable-performance.mjs: model and compatibility checks (Node required only for developer testing)
- docs/: architecture, grade reference and validation results

HTML files have line breaks so they are easier to edit. In VS Code use Shift+Alt+F to apply your preferred formatting and Alt+Z to wrap long lines.

## Verification
108 automated checks passed: 23 authentication/records checks, 41 calendar/profile checks and 44 timetable/performance checks. These cover persistence, validation, linked deadlines, profile/account compatibility, overlap boundaries, calculations and local source links. Browser visual and interaction verification remains manual; the connected browser could not reach the local preview server in the preceding update. Follow the test checklists using the Laragon localhost address above.

## Demo storage
Accounts use pundana.users.v1; sessions use pundana.session.v1. Academic data stays under pundana.academics.v1.<accountId>. Old records receive empty grade/history collections in memory when needed; new saves preserve existing subjects, assignments and classes.

Passwords use random salts and PBKDF2-SHA256 (100,000 iterations). Sessions last up to 24 hours by default or seven days when remembered. This remains a client-side demonstration: local records and guards can be edited, so use sample passwords and do not treat it as secure university access. Reset site data through browser settings only when you intend to remove demo accounts and records.

## Attribution
UiTM-inspired colours and the supplied campus photograph are project material, not an endorsement. Visible independent IMS566 student attribution remains on every page; add your own student/author details if required by your lecturer. Bootstrap 5.3.3 is MIT licensed; its original header is retained.

## Test the Academic Calendar
1. Open Academic Calendar. Your saved assignment deadlines appear automatically on their due dates, including completed assignments labelled Completed. The calendar combines all saved semesters; select an event-type filter to narrow the view.
2. Select a date or use Go to date. Click Add event, enter a title such as Practice presentation, choose Presentation, optionally enter 10:30 and notes, then save.
3. Check the event in both the selected-day panel and the month list. Click a month-list entry to select its date.
4. Edit the event, cancel a deletion, then reload to check it is saved.
5. Change an assignment due date in Assignment Tracker. Return to Calendar and check the deadline moved once. Assignment deadlines are edited/deleted in the tracker; calendar events have their own Edit and Delete buttons.
6. Test next/previous month, Today, type filters and arrow-key navigation between dates. Supported calendar dates are 1900–2100. Blank time means an untimed date-only event. Times use the local device timezone.

## Test Student Profile
1. Open Student Profile and click Edit profile.
2. Add programme/course, faculty and current semester. Save and reload to check persistence.
3. Your registered name, email and student ID appear in the profile. Student ID is fixed. Profile semester is descriptive and does not move enrolled subjects or classes between semesters.
4. If you change your email, sign in using the new email or your existing student ID. Your password is unchanged. Duplicate account emails are rejected.
5. Account totals reflect your saved academic records. Profile details are self-entered; there is no university verification.

## Additional source files
- calendar.html, assets/js/calendar.js and assets/js/calendar-data.js: calendar UI and independent event model
- profile.html and assets/js/profile.js: editable student profile
- assets/css/calendar-profile.css: new page layouts
- assets/js/auth.js: adds validated profile updates to the existing account record
- tests/calendar-profile.mjs and docs/calendar-profile-validation.md: checks and results

Custom events add an optional events array to your existing academic record. Assignment deadlines are derived on every read and are never copied into it. Name, email and optional programme/faculty/currentSemester fields live in the existing user record; password hash, salt, student ID and stable account ID are preserved. All nine planned pages are now implemented for the local demonstration.

## Final submission review
Use docs/FINAL-CHECKLIST.md for the browser tests, screenshot list and demonstration sequence. Full final test results are recorded in docs/FINAL-VALIDATION.md. The checklist does not replace any report or requirements set by your lecturer.

## Chart.js data visualisation (guideline 3.5)
The Dashboard includes a responsive Chart.js doughnut chart of saved assignment statuses: Completed, In progress and Not started. Counts come from the same records as Assignment Tracker and the dashboard totals; they are not randomly generated. Hover to see counts and percentages. Empty accounts show an empty state. The optional sample preview is labelled separately. Chart.js 4.5.1 and its MIT licence are bundled locally, so no CDN connection is needed at runtime. See docs/CHARTJS-VISUALISATION.md for implementation and testing.

## Approved lavender design
The approved lavender concept now styles all nine pages. It includes a lavender sidebar, purple active navigation, coloured summary cards, purple page banners, yellow page-action buttons, lavender table headers and subject-code badges. The campus photograph, Chart.js chart and saved-data features are retained. Theme sources: assets/css/lavender-theme.css and assets/js/lavender-theme.js. The small theme script only decorates subject labels; existing account and academic logic is unchanged. After updating, press Ctrl+F5. See docs/LAVENDER-THEME.md for the visual checklist.

## Additional graph: GPA by semester
Academic Performance now includes a Chart.js bar chart comparing saved semester GPAs. Values use the existing credit-weighted calculation from subject grades. All-grades-entered bars are purple, provisional bars are yellow, and ungraded semesters have no bar. The selected semester is outlined. The chart updates when grades change and includes exact values and grade coverage in a text table. One graded semester produces one bar. This supplements the Dashboard assignment-status chart. See docs/GPA-CHART.md and docs/GPA-CHART-VALIDATION.md.

## English lecturer-demo courses
The lecturer demo uses TFC451 Introductory French (Level II) in place of Mandarin, and IMS561 Web Publishing in place of IMS563. Course names and credits follow the supplied course-list image, including IMS566 at 4 credits and LCC501 English for Professional Correspondence. Existing historical demo records are retained. Demo subject names are refreshed once after login when this course revision is installed; existing record IDs and linked academic records are preserved. Regular accounts retain their own saved data.

## Supplied course and assignment records
The lecturer demo uses the supplied eight-course list in English. IMS563 is Data and Information Visualisation, and TFC451 is Introductory French (Level II). Existing credits and semester labels are retained. CTU554 uses 2 credits and semester 4.

The provided real assignments are CTU554 on 4 November 2026 (Completed), IMS564 Literature Survey on 13 November 2026 (Completed), and IMS564 Individual Assignment – User Experience Design on 25 November 2026 (In progress, Week 9). The supplied dates use 2026. Demo login applies this revision once and preserves subsequent edits. Other pre-existing demonstration information, such as timetable and grade examples, remains illustrative.
