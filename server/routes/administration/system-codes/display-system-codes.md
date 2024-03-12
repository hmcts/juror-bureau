# 3.0 Display system codes
## 3.0.1 Description
From the system codes administration page, the user will be shown a list of code types links, which they can click on to show each individual related code and it's description. 

## 3.0.2 Preconditions
This flow starts once a system administrator has logged in and selected the system codes tab. Or the courts/bureau user has logged in selected the court/bureau administration module and selected the system codes tab.

## 3.0.3 Controllers
`bureau/server/routes/administrator/system-codes/system-codes.controller.js`

| Method name | Purpose |
|-|-|
| getSystemCodesList() | This controller renders the page with the list of system code type links ot select from. |
| getViewCodes() | This controller is invoked by clicking a link on the system codes page page. It makes a call to the system codes API and then renders the page showing the relevant codes and their descriptions. |

## 3.0.4 Filters
N/A

## 3.0.5 Validators
N/A

## 3.0.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| systemCodesDAO | `GET moj/administration/codes/{codeType}` | Fetches the current global expense rates and limits. | `CodeDescriptionResponse` |

## 3.0.7 Utilities
N/A

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Failed to fetch system codes

## 3.0.10 Templates

`bureau/client/templates/administration/system-codes-list.njk` 

This template renders a page links to each type of system codes list.

`bureau/client/templates/administration/system-codes.njk` 

This template renders a page with a table showing the speicied codes along with their descriptions.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/umls/display-system-codes.svg)