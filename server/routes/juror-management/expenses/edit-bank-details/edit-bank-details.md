# 3.0 Edit Bank Details
## 3.0.1 Description
From the either the juror record expenses tab or the draft expense record page, add/change the jurors bank details. This flow includes one additional page. 

## 3.0.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Expenses tab](../../juror-record/expenses) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user clicks add or change bank details.

## 3.0.3 Controllers
`bureau/server/routes/juror-management/expenses/edit-bank-details/edit-bank-details.controller.js`

| Method name | Purpose |
|-|-|
| getBankDetails() | This controller makes a call to the bank details API and then renders the page for inputing/updating the jurors bank details. |
| postBankDetails() | This controller is invoked by the POST request from the bank details page. It validates the all of the details entered and then calls the bank details API, redirecting back to the inital page the user began this journey from. |

## 3.0.4 Filters
N/A

## 3.0.5 Validators
`bureau/server/config/validation/bank-details.js`

This validator ensures the following;
* Account number must be 8 digits exactly, cannot be empty, no letters or special characters.
* Sort code must be 6 digits exactly, cannot be empty, no letters or special characters.
* Account holder's name cannot be longer than 18 characters, and must not contain full stops, commas, or double quotes.


## 3.0.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorBankDetailsDAO | `GET moj/juror-record/bank-details` | Fetches the current bank details for the given juror. | `BankDetailsResponseDTO` |
| jurorBankDetailsDAO | `PATCH moj/juror-record/update-bank-details` | Sets the bank details for given juror number. | N/A |

## 3.0.7 Utilities
N/A

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Failed to fetch jurors bank details
* Failed to set jurors bank details

## 3.0.10 Templates

`bureau/client/templates/expenses/bank-details.njk` 

This template renders a page with a number of fields to enter the jurors bank details, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/edit-bank-details.svg)