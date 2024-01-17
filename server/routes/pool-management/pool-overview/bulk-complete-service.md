# 3.0 Bulk Complete Service
## 3.0.1 Description
From the Pool Overview, complete service for multiple jurors at once. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.0.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Complete service' button.

## 3.0.3 Controllers
`bureau/server/routes/pool-management/pool-overview/pool-overview.controller.js`

| Method name | Purpose |
|-|-|
| postCompleteService() | The controller invoked by the POST request from the front end form. This controller validates the jurors that have been selected, and reroutes the request to the appropriate page. |
| getCompleteServiceContinue() | This controller renders the interstitial page if the user has selected jurors to complete service who are not in 'Responded' status. |

`bureau/server/routes/shared/complete-service/complete-service.controller.js`

| Method name | Purpose |
|-|-|
| getCompleteServiceConfirm() | This controller renders the interstitial page for selecting a date to complete the selected jurors service on. |
| postCompleteServiceConfirm() | This controller is invoked by the POST request from the complete service confirm interstital page. It validates the date selected by the user. // TODO this should call the data access object once it exists. It then redirects to the Pool Overview page on success. |

## 3.0.4 Filters
No filters are used in this flow

## 3.0.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of jurors on the Pool Overview page

`bureau/server/config/validation/complete-service.js`

This validator ensures a valid date has been input, and that the completion date is after each selected juror's service start date.

## 3.0.6 Request objects
// TODO not yet implemented

## 3.0.7 Utilities
No utilities are used in this flow.

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
None known.

## 3.0.10 Templates
`bureau/client/templates/shared/complete-service/complete-service-confirm.njk`

This template displays a date picker for selecting the completion date of the jurors service.

`bureau/client/templates/shared/complete-service/some-responded.njk`

If the user has selected some jurors who are not in a 'responded' state but also selected some who are in a 'responded' state, this template is used to display the list of jurors who are not in the 'responded' state. The user can then directly complete the service of the 'responded' jurors, or return to the pool overview.

`bureau/client/templates/shared/complete-service/none-responded.njk`

If the user has only selected jurors who are not in a 'responded' state, this template displays an error, and the user can return to the pool overview.

## 3.0.11 Sequence diagram
![](/frontend/bureau/umls/bulk-complete-service.svg)