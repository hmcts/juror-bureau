# 3.0 Bulk Reassign
## 3.0.1 Description
From the Pool Overview, reassign multiple pool members at once to a different pool at either the same or a different court. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.0.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Reassign' button.

## 3.0.3 Controllers
`bureau/server/routes/pool-management/pool-overview/pool-overview.controller.js`

| Method name | Purpose |
|-|-|
| postReassign() | The controller invoked by the POST request from the front end form. This controller validates the jurors that have been selected, and reroutes the request to the appropriate page. |

`bureau/server/routes/juror-management/juror-management.transfer.controller.js`

| Method name | Purpose |
|-|-|
| getReassignJuror() | This controller renders the interstitial page for selecting a pool to reassign the selected jurors to. |
| postReassignJuror() | This controller is invoked by the POST request from the select a pool page. It calls the movement validation API, and either renders a screen prompting the user that a select group of jurors cannot be reassigned, where they can then either go back and reselect jurors or continue which removes all unmovable jurors and calls postConfirmReassignJuror(). If all jurors are valid for movement then the reassign API is called and the user is redirected back to the newly updated pool. |
| getChangeCourt() | This controller is invoked by the 'change court' link on the select pools page, rendering the change court page where the user can select a differnt court to reassign to. |
| postChangeCourt() | This controller is invoked by the POST request from the change court page. It validates the user has selected a valid court and then redirects the user back to the select pools screen for the newly selected court. |
| postConfirmReassignJuror() | This is invoked by the POST request on the movement validation screen, the reassign API is called for the list of jurors which can be moved and the user is redirected back to the newly updated pool |

## 3.0.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.
* `capitalizeFully` is used to format court location names to Title Case.

## 3.0.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of pool members on the Pool Overview page

`bureau/server/config/validation/pool-management.js`

This validator endures that a pool has been selected to reassign jurors to.


## 3.0.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| validateMovement | `PUT moj/manage-pool/movement/validation` | Determines if the selected pool members are valid to reassign to the target pool. | `PoolSummaryResponseDTO` |
| availablePools | `GET moj/manage-pool/available-pools/{locationCode}` | Gathers a list of available pools at given court location along with their details. | `AvailablePoolsInCourtLocationDto` |
| reassignJuror | `PUT moj/manage-pool/reassign-jurors` | Reassigns the selected pool members to the target pool. | `jurorManagementRequestDto` |

## 3.0.7 Utilities
* `matchUserCourt`
* `getLocCodeFromCourtNameOrLocation`
* `transformCourtNames`
* `sendReassignRequest()` - Sends request to API to reassign select jurors, handling any errors that may come back, and redirecting the user to pool overview screen on success.

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
* Failed to fetch available pools for reassigning a juror
* Failed to match the selected court
* Failed to check transfer validity
* Failed to reassign the juror to a different pool

## 3.0.10 Templates

`bureau/client/templates/juror-management/reassign/pools.njk` 

This template renders an interstitial page that displays a table of all available pools, along with a radio button next to each which can be seelcted and confirmed by using the form buttons at the bottom.

`bureau/client/templates/juror-management/reassign/select-court.njk` 

This template renders a page that displays an autocomplete input to select a court to change which pools are shown to user. 

`bureau/client/templates/pool-management/_common/select-court` 

This template renders a page that displays an autocomplete input to select a court to change which pools are shown to user. 

`bureau/client/templates/pool-management/movement/bulk-validate.njk` 

If some of the pool members selected are not valid to reassign with the given settings, this page will be displayed, and will display which jurors are not valid and why. It gives the user the option to cancel, or to continue and reassign only those pool members not listed.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.0.11 Sequence diagram
![](/frontend/bureau/umls/bulk-reassign.svg)