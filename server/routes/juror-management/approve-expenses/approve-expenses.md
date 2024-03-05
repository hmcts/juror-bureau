# 3.0 Approve Expenses
## 3.0.1 Description
From the either the approve expenses page, the user will be shown a table of expenses pending apporval, of which they can select and approve. 

## 3.0.2 Preconditions
This flow starts on the from the Home Page, then navigate to juror manangement module, selecting the approve expenses tab.

## 3.0.3 Controllers
`bureau/server/routes/juror-management/approve-expenses/approve-expenses.controller.js`

| Method name | Purpose |
|-|-|
| getApproveExpenses() | This controller makes a call to the expenses for approval API and then renders the page for selecting the expenses to approve. |
| postApproveExpenses() | This controller is invoked by the POST request from the approve expenses page. It validates that the user has selected at least one and then calls the approve expenses API, if any of the expenses have been submitted by the user, the getCannotApprove() method is called. Otherwise the page is refreshed showing a banner message and the newly updated for approval table. |
| getCannotApprove() | This controller renders the page showing the user that they cannot approve some of the expenses they have selected. |
| postCannotApprove() | If the user has still selected some jurors that can be approved then this controller is invoked by the POST request from the cannot approve page, calling the approve expenses API, and redirecting back to the initial approve expenses page. |

## 3.0.4 Filters
N/A

## 3.0.5 Validators
`bureau/server/config/validation/approve-expenses.js`

This validator ensures that the user has entered 2 well formed dates to filter expenses by.

## 3.0.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| approveExpensesDAO | `GET moj/expenses/approval/{locCode}/{paymentMethod}` | Fetches the records of expenses to be approved, filtered by BACS or CASH. | `PendingApprovalDTO` |
| approveExpensesDAO | `POST moj/expenses/approve` | Approves the supplied list of the expenses. | N/A |

## 3.0.7 Utilities
urlBuilder() - Builds the query params to be added on to url's for this flow.

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Unable to fetch approval expenses data
* Unable to approve selected expenses

## 3.0.10 Templates

`bureau/client/templates/expenses/approve-expenses/approve-expenses.njk` 

This template renders a page with a detials object which contains two date picker fields to select dates to filter the approvals list, along with a selectable row table with the detials of all records for approval.

`bureau/client/templates/expenses/approve-expenses/cannot-approve.njk` 

This template renders a page to show the user cannot approve all of the selected jurors, along with buttons to process the remaining or go back.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/approve-expenses.svg)