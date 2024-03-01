# 3.0 Bulk Transfer
## 3.0.1 Description
From the either the juror record attendance tab or the draft expense record page, add a non-attendance day for the juror. This flow includes one additiona page. 

## 3.0.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Attendance tab](../../juror-record/attendance) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user selects some number of jurors using the checkboxes, and then clicks the 'Reassign' button.

## 3.0.3 Controllers
`bureau/server/routes/juror-management/expenses/non-attendance-day/non-attendance-day.controller.js`

| Method name | Purpose |
|-|-|
| getNonAttendanceDay() | This controller renders the page for selecting a date to add a non-attendnace day for the juror. |
| postNonAttendanceDay() | This controller is invoked by the POST request from the select date page. It validates the date entered and then calls the non-attendance date API, redirecting back to the inital page the user began this journey from. |

## 3.0.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.

## 3.0.5 Validators
`bureau/server/config/validation/non-attendance-day.js`

This validator ensures that the date selected is valid, and in the correct format.

## 3.0.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorNonAttendanceDao | `POST moj/juror-management/non-attendance` | Adds a non atendance day for given juror and date. | N/A |

## 3.0.7 Utilities
* N/A

## 3.0.8 Validations
The post function uses BE validation to show error states if the selected date is already an attendance date or the date is before the service start date.

## 3.0.9 Exceptions
* Failed to add a non-attendance day for juror

## 3.0.10 Templates

`bureau/client/templates/juror-management/non-attendance-day.njk` 

This template renders a page with a date picker input to select the non-attendance date, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/add-non-attendance-day.svg)