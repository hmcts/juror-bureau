# 3.0 Update expense rates and limits
## 3.0.1 Description
From the expense rates and limits administration page, the administration user will be shown a list of input fields for each expense rate/limit, which they can then proceed to update. 

## 3.0.2 Preconditions
This flow starts once a system administrator has logged in and selected the expense rates and limits tab.

## 3.0.3 Controllers
`bureau/server/routes/administrator/expense-limits/expense-limits.controller.js`

| Method name | Purpose |
|-|-|
| getExpenseLimits() | This controller makes a call to the expense rates and limits API and then renders the page with input fields containing current values. |
| postExpenseLimits() | This controller is invoked by the POST request from the expense rates and limits page. It validates all of the inputs the user has made before making another call to the expense rates and lmitis API to ensure that no other user has updated these values while they wer eon the page. Following this validation the values are posted tot he API to be saved to the database. |

## 3.0.4 Filters
N/A

## 3.0.5 Validators
`bureau/server/config/validation/update-expense-rates.js`

This validator ensures that each field has a value entered and that each field only has numbers and a decimal point.

## 3.0.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| expenseRatesAndLimitsDAO | `GET moj/administration/expenses/rates` | Fetches the current global expense rates and limits. | `ExpenseRatesDTO` |
| expenseRatesAndLimitsDAO | `POST moj/administration/expenses/rates` | Sets the new global expense rates and limits. | N/A |

## 3.0.7 Utilities
N/A

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Failed to fetch expense rates and limits
* Failed to compare etags for when updating expense limits and rates
* Failed to update expense rates and limits

## 3.0.10 Templates

`bureau/client/templates/administration/expense-limits.njk` 

This template renders a page with multiple inputs for each global expense rates and limits, along with a save button to post these values to the API.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/update-expense-rates-and-limits.svg)