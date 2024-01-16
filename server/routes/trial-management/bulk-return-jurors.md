# 3.0 Bulk return jurors
## 3.0.1 Description
From the Jury Details view, return multiple jurors at once. This flow includes between one and three additional pages, depending on the choices selected through the flow, and can check in, check out, return and complete service for jurors.

## 3.0.2 Preconditions
This flow starts on the [Jury Details page](#jury-details). The user selects some number of jurors using the checkboxes, and then clicks the 'Return' button.

## 3.0.3 Controllers
`bureau/server/routes/trial-management/returns.controller.js`

| Method name | Purpose |
|-|-|
| postReturnJurors() | The controller invoked by the POST request from the front end form. This controller validates the jurors that have been selected, and reroutes the request to the appropriate page. |
| getReturnAttendance() | This controller renders the interstitial page to determine how to handle the return, either returning and confirming, returning and not confirming, or returning, confirming and completing service for the jurors. |
| postReturnAttendance() | This controller is invoked by the POST request from the handle attendance interstitial page. If no option is selected, it redirects back to it. If the non-completing route is selected, it proceeds to the confirm screen, otherwise to the checkout screen. |
| getReturnCheckOut() | This controller renders the interstitial page to check out and optionally check in the jurors. |
| postReturnCheckOut() | This controller is invoked by the POST request from the check out page. If there are any selected jurors without a check in time, it validates the check in time, and it always validates the check out time. If the validation fails it redirects back the form, otherwise it proceeds to the confirm screen. |
| getReturnConfirm() | This controller renders a confirmation screen, so the user can double check the action they are about to take. |
| postReturnConfirm() | This controller is invoked by the POST request on the confirmation screen. // TODO this should call a data access object once it exists. It then redirects to the Jury Details page on success. |

## 3.0.4 Filters
No filters are used in this flow.

## 3.0.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of jurors on the Jury Details page

`bureau/server/config/validation/check-in-out-time.js`

Two validators from this file are used; one checks the user has input a valid check out time, and the other checks the user has input a valid check in time.


## 3.0.6 Request objects
// TODO not yet implemented

## 3.0.7 Utilities
// TODO to be discussed what this means :)

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
// TODO is this relevant for front end?

## 3.0.10 Templates
`bureau/client/templates/return-attendance.njk`

This templates renders a set of radio buttons to determine how to handle the return.

`bureau/client/templates/return-check-out.njk`

This template renders a check-in and check-out time input.

`bureau/client/templates/confirm-return.njk`

Depending on the route through the flow taken, this template renders all of the options selected through the flow, and confirm and cancel options.

## 3.0.11 Sequence diagram
![](/frontend/bureau/umls/bulk-return.svg)