# X.0 Attendance - Check in
## X.0.1 Description
This journey allows the officer to check jurors in on the day of the trial. They get displayed a list of already checked in jurors, if any, and have a form where they enter times and juror numbers.

## X.0.2 Preconditions
Before submitting, the officer needs to print a list of the jurors available for that day, this list is served separately and will include both checked in and not checked in jurors.

## X.0.3 Controllers
`bureau/server/routes/juror-management/juror-management.controller.js`
`bureau/server/routes/juror-management/attendance/attendance.controller.js`

| Method name | Purpose |
|-|-|
| getAttendance() | Fetches and renders the initial list of jurors already checked in. |
| postCheckIn() | AJAX routing responsible for checking a juror in and returning a table row for a realtime feel. |

## X.0.4 Filters
`dateFilter()`
`convertAmPmToLong()`
`convert12to24()`

## X.0.5 Validators
N/A

## X.0.6 Request objects
`bureau/server/objects/juror-attendace.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorsAttending() | `GET moj/juror-management/appearance` | Fetches the initial list of checked in jurors | `JurorAppearanceResponseDto` |
| jurorsAttending() | `PUT moj/juror-management/appearance` | Sends a PUT request to the api with the checkin information | `JurorAppearanceResponseData` |

## X.0.7 Utilities
`getJurorStatus()`
`padTimeForApi()`

## X.0.8 Exceptions
N/A

## X.0.10 Templates
`bureau/client/templates/juror-management/attendance.njk`
This template is responsible for rendering the initial list of checked in jurors, if any, and also responsible for displaying the for to submit the checkin data of the juror.

`bureau/client/templates/juror-management/unconfirmed/table-row.njk`
This template is used for building and asynchronously returning a table row back to the user. This row is then used to replace a temporary row initially generated as a placeholder whe checking in a juror.

## X.0.11 Client side JS
`client/js/attendance.js`

### Functions
| Name | Purpose |
|-|-|
| validate() | Validates the check in form inputs. |
| validateJurorNumber() | Validates the juror number. |
| validateCheckInTime() | Validates the checkin time. |
| addError() | Adds an error to the page. |
| jurorNumberError() | Works together with addError() to add the juror number error to the page. |
| checkInTimeError() | Works together with addError() to add the checkin time error to the page. |
| replaceTableRow() | Replaces the temporary row added when submitting the checkin time. This row is generated on the server and sent back to the client. |
| updateJurorsCount() | Updates the count of checked in jurors. |
| addTempRow() | Adds a temporary row with the juror number and the checkin time. This row will then be replaced using replaceTableRow() once the api returns a response. |
| buildTimeString() | Builds a time string from the 3 inputs used to define a checkin time. |
| timePeriod() | Resolved which time period was selected, am or pm. |
| checkForDuplicateRow() | Checks if the juror number entered is already present in the list. If so, an error will be displayed. |

### Other scripting
This client side script also uses jquery to asynchronously run api requests with the data entered in the checkin form.

## X.0.12 Sequence diagram
<!-- ![](/frontend/bureau/umls/attendance-checkin.svg) -->