# 3.0 Add Default Expenses
## 3.0.1 Description
From the either the juror record expenses tab or the draft expense record page, add/change the jurors default expenses. This flow includes one additional page. 

## 3.0.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Expenses tab](../../juror-record/expenses) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user clicks add or change efault expenses.

## 3.0.3 Controllers
`bureau/server/routes/juror-management/expenses/expenses.controller.js`

| Method name | Purpose |
|-|-|
| getDefaultExpenses() | This controller makes a call to the default expenses summary API and then renders the page for inputing/updating the jurors default expenses. |
| postDefaultExpenses() | This controller is invoked by the POST request from the default expenses page. It validates the all of the details entered and then calls the default expenses API, redirecting back to the inital page the user began this journey from. |

## 3.0.4 Filters
N/A

## 3.0.5 Validators
`bureau/server/config/validation/default-expenses.js`

This validator ensures the following;
* If loss of earnings is not empty, then it does not contain any letters or special characters.
* If either time fields are empty, then they do not contain any letters or special characters. If minutes are entered that the value is beteen 0 and 59.
* If mileage is entered, then it must be a whole number and not contain any letters or special characters.
* If smartcard is entered, then it is 20 characters or less.

## 3.0.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| defaultExpensesDAO | `GET moj/expenses/default-summary/{jurorNumber}` | Fetches the current values for jurors default expenses. | `DefaultExpenseResponseDTO` |
| defaultExpensesDAO | `post moj/expenses/set-default-expenses/{jurorNumber}` | Sets the default expense value for given juror number. | `DefaultExpenseResponseDTO` |

## 3.0.7 Utilities
N/A

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Failed to fetch jurors default expenses
* Failed to set default expenses

## 3.0.10 Templates

`bureau/client/templates/expenses/default-expenses.njk` 

This template renders a page with a number of fields to enter the jurors default expense values, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/add-default-expenses.svg)