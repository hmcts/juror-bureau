# 3.0 Bulk Transfer
## 3.0.1 Description
From the Pool Overview, transfer multiple pool memebrs at once to a different court. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.0.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Transfer' button.

## 3.0.3 Controllers
`bureau/server/routes/pool-management/pool-overview/pool-overview.controller.js`

| Method name | Purpose |
|-|-|
| postTransfer() | The controller invoked by the POST request from the front end form. This controller ensures This controller validates the jurors that have been selected, and reroutes the request to the appropriate page. |
| postTransferConfirm() | This controller is invoked by the POST request form the end of the flow. When called, it executes the call to the backend to transfer the selected pool members. |
| postTransferContinue() | This controller is invoked by the POST request form the end of the flow. When called, it executes the call to the backend to transfer the appropriate pool members when some pool members can't be transfered. |

`bureau/server/routes/juror-management/juror-management.transfer.controller.js`

| Method name | Purpose |
|-|-|
| getCourtTransfer() | This controller renders the interstitial page for selecting a court to transfer to, as well as date the date pool members to be transfered. |
| postCourtTransfer() | This controller is invoked by the POST request from the previous page. It calls the movement validation API, and either renders an error screen, or redirects to the confirm screen. |
| getCourtTransferConfirm() | This controller renders a page to confirm the actions to be taken. |

## 3.0.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.
* `capitalizeFully` is used to format court location names to Title Case.

## 3.0.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of pool members on the Pool Overview page

`bureau/server/config/validation/juror-bulk-transfer.js`

This validator ensures that a court has been selected, and that an appropriate date has been selected for the transfer date.

## 3.0.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| validateMovement | `PUT moj/manage-pool/movement/validation` | Determines if the selected pool members are valid to transfer to the target court. | `PoolSummaryResponseDTO` |

`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorTransfer | `PUT moj/manage-pool/transfer` | Transfers the selected pool members to the target court. | `TransferPoolMembersRequestDTO` |

## 3.0.7 Utilities
* `matchUserCourt`
* `getLocCodeFromCourtNameOrLocation`
* `transformCourtNames`

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
None known.

## 3.0.10 Templates

`bureau/client/templates/juror-management/transfer-court.njk` 

This template renders an interstitial page that displays an autocomplete input to select a court, and a date picker to select a service start date

`bureau/client/templates/juror-management/transfer-court-confirm.njk` 

This template renders a confirmation screen, confirming the court the selected pool members will be selected to, and gives the user an option to confirm or cancel. 

`bureau/client/templates/pool-management/validate-movement.njk` 

If some of the pool members selected are not valid to transfer with the given settings, this page will be displayed, and will display which jurors are not valid and why. It gives the user the option to cancel, or to continue and transfer only those pool members not listed.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/frontend/bureau/umls/bulk-transfer.svg)