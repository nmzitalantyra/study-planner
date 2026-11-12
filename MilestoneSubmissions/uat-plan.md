# User Acceptance Test Plan

## Scope
We will test registration, login, and adding assignments to make sure they work and show errors when something is wrong.

## Test Environment
We will test Study Sprout on localhost using Chrome on a laptop. We will run it with Docker Compose and record the GitHub commit when we test.

## Test cases

| Test ID | Feature / requirement | Acceptance criterion | Preconditions | Test data | User steps | Expected result | Tester ID | Actual result | Status | Issue / follow-up |
|---|---|---|---|---|---|---|---|---|---|---|
| UAT-01 | Registration / account creation | Required fields are identified | Registration page is open; user is signed out | Unique username; valid email; password left blank | 1. Enter username. 2. Enter email. 3. Leave password blank. 4. Submit. | Registration does not complete; feedback identifies the missing password. | Planned: T1 | Not run | Not run | None yet |
| UAT-02 | Registration / account creation | A user with valid information can create an account | Registration page is open; user is signed out | Unique username (user1); email user1@example.com; password 12345678 | 1. Enter username. 2. Enter email. 3. Enter password. 4. Submit. | Registration completes; the user sees a confirmation or is taken to the documented next page (the login page). | Planned: T1 | Not run | Not run | None yet |
| UAT-03 | Login / sign in | A registered user can sign in with correct credentials | A registered account exists (user1 from UAT-02); login page is open; user is signed out | Username user1; password 12345678 | 1. Enter username. 2. Enter password. 3. Submit. | The user is signed in and taken to the dashboard page. | Planned: T1 | Not run | Not run | None yet |
| UAT-04 | Login / sign in | A user with invalid credentials cannot access a protected feature | Login page is open; user is signed out | Username user1; password IncorrectPassword | 1. Enter username. 2. Enter the wrong password. 3. Submit. | Login does not complete; a clear message says the credentials are invalid; the user stays on the login page and cannot open the dashboard. | Planned: T1 | Not run | Not run | None yet |
| UAT-05 | Add assignment form | A user can add an assignment with a title, course, and due date and see it in the assignment list | User is signed in; the home page with the add assignment form is open | Title "Chemistry Lab Report"; course Chemistry; due date 2026-12-20 | 1. Enter the title. 2. Select the course. 3. Choose the due date. 4. Submit the form. | The page stays on the home page; "Chemistry Lab Report" appears in the assignment list with its course and due date; the form fields are cleared. | Planned: T1 | Not run | Not run | None yet |
| UAT-06 | Add assignment form | Required fields are identified | User is signed in; the home page with the add assignment form is open | Title "Chemistry Quiz"; course Chemistry; due date left empty | 1. Enter the title. 2. Select the course. 3. Leave the due date empty. 4. Submit the form. | The assignment is not added; a clear message identifies the missing due date; the assignment list is unchanged. | Planned: T1 | Not run | Not run | None yet |
