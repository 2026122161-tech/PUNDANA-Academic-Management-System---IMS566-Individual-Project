# PUNDANA Academic Management System

PUNDANA is an academic management web application prototype developed for the IMS566 Individual Project. It brings subjects, assignments, weekly classes, grades and academic events into one student workspace.

This is an independent student project inspired by UiTM. It is not an official UiTM system and is not connected to university records.

## Project links

- [Live website](https://2026122161-tech.github.io/PUNDANA-Academic-Management-System---IMS566-Individual-Project/)
- [GitHub repository](https://github.com/2026122161-tech/PUNDANA-Academic-Management-System---IMS566-Individual-Project)

## Features

| Page | Main functions |
| --- | --- |
| Login and Registration | Simulated sign-in, registration, input validation, error feedback and sign-out. |
| Dashboard | Subject and credit totals, assignment completion, upcoming deadlines and today's classes. |
| My Subjects | Add, edit, delete and search subjects; filter by semester. Linked records prevent subject deletion. |
| Assignment Tracker | Add, edit, delete and search assignments; filter by subject and status. |
| Class Timetable | Weekly and daily views, class editing, locations and checks for overlapping sessions. |
| Academic Performance | Enter grades, calculate credit-weighted GPA and estimate CGPA using a previous record. |
| Academic Calendar | View assignment deadlines and manage custom events with month navigation and type filters. |
| Student Profile | Edit name, email, programme, faculty and current semester; view account statistics. |

Navigation is consistent across pages, with responsive layouts for desktop and mobile screens.

## Login and evaluation

Open the live website in Google Chrome and use:

| Field | Value |
| --- | --- |
| Login ID | `Lecturer` |
| Password | `Pundana123` |
| Initial profile email | `lecturer.demo@gmail.com` |

The account starts with eight Semester 4 subjects, three supplied assignments, eight weekly class sessions totalling 22 contact hours, grades and calendar events. The timetable follows the supplied schedule. Grades, previous CGPA and additional calendar events are illustrative records for exploring the features, not official results or university announcements.

All starting records can be edited through their pages. New registered accounts begin with their own workspace.

Suggested checks:

1. Enter an incorrect password and check the error message, then sign in correctly.
2. Search for a subject and filter assignments by status.
3. Edit an assignment and check its updated status in the Dashboard and its deadline in the Calendar.
4. Edit a class and try overlapping times to check validation.
5. Change a grade and observe the GPA calculation and chart.
6. Edit the profile, refresh and check that changes remain saved.
7. Check the navigation and forms on a mobile screen.

## Frameworks and libraries

| Technology | Use |
| --- | --- |
| HTML5 | Page structure, forms, navigation and semantic content. |
| Bootstrap 5.3.3 | Front-end framework for layout, forms and interface components. |
| Custom CSS | Purple, lavender, navy and yellow styling, responsive page layouts and branding. |
| JavaScript | Validation, authentication simulation, academic calculations and browser storage. |
| Vue.js 3.5.24 | Reactive Assignment Tracker forms, search, filters, summary cards and table rendering. |
| Chart.js 4.5.1 | Assignment-status doughnut chart and semester-GPA bar chart. |

Bootstrap, Vue and Chart.js are bundled in `assets/vendor`; no package installation or build step is required to run the website. Third-party licence files are retained in that folder.

## Data visualisation

The Dashboard doughnut chart counts completed, in-progress and not-started assignments from the saved Assignment Tracker records. It updates when assignments change and provides hover information.

The Academic Performance bar chart displays credit-weighted semester GPA calculated from entered subject grades. Incomplete grade coverage is marked as provisional, while ungraded semesters have no GPA bar. With the initial Semester 4 dataset, one semester bar is shown.

GPA and CGPA are personal estimates. They do not account for every university rule concerning repeated courses, exemptions or credit transfers and are not official academic results.

## Data storage and limitations

Accounts and academic records are stored in the current browser using localStorage and sessionStorage. Changes remain in that browser unless its site data is cleared. They are not shared between devices, browsers or users, and editing records does not change the repository files. Private browsing data is normally removed when the private session ends.

Authentication is a client-side simulation with public evaluation credentials. It is not a secure production login system. Use sample passwords when registering and avoid entering sensitive personal information.

## Source organisation

- Root `.html` files: the nine application pages.
- `assets/css/`: shared theme and page-specific styles.
- `assets/js/`: authentication, storage, page behaviour, Vue components and chart logic.
- `assets/images/`: campus photograph and UiTM logo.
- `assets/vendor/`: bundled libraries and their licences.
- `docs/`: supporting design and validation notes, when included.
- `tests/`: automated checks, when included.

The project is published from the repository's `main` branch through GitHub Pages. It can also be served locally with Laragon or another static web server; open `index.html` through the server address.

## Attribution

The campus photograph was supplied by the project owner. The UiTM logo is included unchanged from the [UiTM library repository](https://iknow.library.uitm.edu.my/71/) for university context, with source details in `assets/images/uitm-logo-source.txt`. Its inclusion does not imply endorsement. Independent student-project attribution appears on the website.