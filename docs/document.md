Front matter, etc

# Contents

* [1.0 Introduction](#1.0-introduction)
* [2.0 Application pages](#1.0-application-pages)
* [2.1 Approve Jurors page](#2.1-approve-jurors-page)
* [3.0 Process flows](#3.0-process-flows)
* [3.1 Bulk return jurors](#3.1-bulk-return-jurors)
* [3.2 Manage trials](#3.2-manage-trials)
* [3.3 Create a trial](#3.3-create-a-trial)
* [3.4 Processing a Summons Reply](#3.4-processing-a-summons-reply)
* [3.5 Bulk Complete Service](#3.5-bulk-complete-service)
* [3.6 Bulk Reassign](#3.6-bulk-reassign)
* [3.7 Bulk Transfer](#3.7-bulk-transfer)
* [3.8 Bulk Change Next Due At Court](#3.8-bulk-change-next-due-at-court)
* [3.9 Approve Expenses](#3.9-approve-expenses)
* [3.10 Add Default Expenses](#3.10-add-default-expenses)
* [3.11 Add non-attendance day](#3.11-add-non-attendance-day)
* [3.12 Edit Bank Details](#3.12-edit-bank-details)
* [3.13 Approve Created Juror](#3.13-approve-created-juror)
* [3.14 Manual Police Check](#3.14-manual-police-check)
* [4.0 Helper functions](#4.0-helper-functions)

# 1.0 Introduction
This LLD details the front-end of the application. This includes the node server that manages the routing and composition of pages in the application, but does not include the actions handled by the back-end Java application.

# 2.0 Application Pages
This section details main pages available in the application. This includes how the end user navigates to them, who has access to them, and how the page gathers any data rendered to the page.

# 2.1 Approve Jurors page
## 2.1.1 Description
This page allows Senior Jury Officers to view and approve jurors who have been manually created, as well has a historic list of created jurors.

## 2.1.2 Preconditions
The Approve Jurors page can be found in the Juror Management app. It is accessible from the navigation bar.

// TODO
It can also be accessed by relevant users from the notifications on the home page.

// TODO
It should only be visible and accessible to Senior Jury Officers, who are identified in a manner to be determined.

## 2.1.3 Controllers
`bureau/server/routes/juror-management/manage-jurors.controller.js`

| Method name | Purpose |
|-|-|
| getApprove() | Renders the page. |

## 2.1.4 Filters
No filters are used in this page.

## 2.1.5 Validators
// TODO: This isn't relevant for pages? Maybe we need more-different template?

## 2.1.6 Request objects
// TODO: Not yet implemented
`bureau/server/objects/requset-object.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| objectName | `METHOD moj/route/called` | Request object purpose | `ResponseObjectDTO` |

## 2.1.7 Utilities
No utilities are used.

## 2.1.8 Validations
// TODO covered in 3.0.5, drop this section?

## 2.1.9 Exceptions
None known.

## 2.1.10 Templates
`bureau/client/templates/juror-management/manage-jurors/approve-jurors.njk`

This template returns a list of pending jurors, and allows the user to toggle views between pending jurors and all created jurors within the retention window.

`bureau/client/js/components/approval-toggle.js` // TODO: Should this be in its own section?

This code supports the view by setting up handlers to switch between the two sets of views. If javascript is disabled, it will display all created jurors, including historical ones.

## 2.1.11 Sequence diagram
![](/frontend/bureau/umls/approve-juror-page.svg)



# 3.0 Process Flows
This section details the flows users follow to enact changes in the application. This includes actions taken by the end user, how the application processes those actions, and how the application supplies feedback to the end user.

# 3.1 Bulk return jurors
## 3.1.1 Description
From the Jury Details view, return multiple jurors at once. This flow includes between one and three additional pages, depending on the choices selected through the flow, and can check in, check out, return and complete service for jurors.

## 3.1.2 Preconditions
This flow starts on the [Jury Details page](#jury-details). The user selects some number of jurors using the checkboxes, and then clicks the 'Return' button.

## 3.1.3 Controllers
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

## 3.1.4 Filters
No filters are used in this flow.

## 3.1.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of jurors on the Jury Details page

`bureau/server/config/validation/check-in-out-time.js`

Two validators from this file are used; one checks the user has input a valid check out time, and the other checks the user has input a valid check in time.


## 3.1.6 Request objects
// TODO not yet implemented

## 3.1.7 Utilities
// TODO to be discussed what this means :)

## 3.1.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.1.9 Exceptions
// TODO is this relevant for front end?

## 3.1.10 Templates
`bureau/client/templates/return-attendance.njk`

This templates renders a set of radio buttons to determine how to handle the return.

`bureau/client/templates/return-check-out.njk`

This template renders a check-in and check-out time input.

`bureau/client/templates/confirm-return.njk`

Depending on the route through the flow taken, this template renders all of the options selected through the flow, and confirm and cancel options.

## 3.1.11 Sequence diagram
![](/frontend/bureau/umls/bulk-return.svg)

# 3.2 Manage trials
## 3.2.1 Description
From the manage trials view, jury officers can manage all/active trials. This flow includes two additional pages.

## 3.2.2 Preconditions
This flow starts once the user has logged in. The user opens the apps tray and clicks the 'Trial Management' link.

## 3.2.3 Controllers
`bureau/server/routes/trial-management/trial-management.controller.js`

| Method name | Purpose |
|-|-|
| getTrials() | This controller renders the initial trial management page where the jury officer can select whether to see a list of active or all trials, each making a call to the API endpoint to fetch those details. |
| getTrialDetail() |  This controller fetches all detail of a specific trial then renders trial-detail template to the user. |

## 3.2.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.
* `capitalizeFully` is used to format court location names to Title Case.

## 3.2.5 Validators
N/A

## 3.2.6 Request objects
`bureau/server/objects/create-trial.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| trialsListObject | `GET moj/trial/list?is_active&page_number&sort_by&sort_order` | Fetches a paginated and sortable list of all or active trials which available to the current user dependant on the query parameter. | `CourtroomsListDTO` |
| trialDetailsObject | `GET moj/trial/summary?trial_number&location_code` | Fetches the summary details for a specific trial using provided query parameters. | `PageTrialListDTO` |

## 3.2.7 Utilities
* `paginationBuilder`

## 3.2.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.2.9 Exceptions
* Failed to fetch trials
* Failed to fetch trial details

## 3.2.10 Templates
`bureau/client/templates/trial-management/trials.njk`

This templates renders two radio buttons to select all or active trials along with the corresponding sortable list of trials and detials.

`bureau/client/templates/trial-management/trial-detail.njk`

This template renders a summary table of the created trials details, along with buttons to 'Generate panel', 'Edit trial', and 'End trial'

## 3.2.11 Sequence diagram
![](../../../umls/manage-trials.svg)

# 3.3 Create a trial
## 3.3.1 Description
From the manage trials view, jury officers can create a new trial. This flow includes between two additional pages.

## 3.3.2 Preconditions
This flow starts on the [Manage Trials page](../manage-trials.md). The user clicks the 'Create a trial' button.

## 3.3.3 Controllers
`bureau/server/routes/trial-management/create-trial.controller.js`

| Method name | Purpose |
|-|-|
| getCreateTrial() | This controller renders the initial page where the jury officer will enter the details for the new trial to be created. |
| postCreateTrial() | This controller is invoked by the POST request from the create trial page. It validates the user’s input for each field, if any field is invalid the user is redirected to the form showing any errors. If all of the inputs are valid then the create trial request object is called and the details are sent to the API endpoint where the trial is then created. The user is then redirected to the newly created [trial’s detail page](../manage-trials.md) on success. |

## 3.3.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.

## 3.3.5 Validators
`bureau/server/config/validation/create-trial.js`

This validator checks that the user has enter a valid input into each of the specific input fields
* A valid case number has been entered.
    * The trial number only contains numbers and uppercase letters.
    *	The trial number is less than 16 characters.
*	A trial type has been selected.
*	Either defendants or respondents have been entered dependant on whether a civil or criminal trial is being created.
*	A valid start date has been entered.
    *	The start date does not include any letters or special characters.
    *	The start date is in the correct format, for example 31/03/2023.
    *	The start date is a real date.
*	A judge has been selected from the auto-complete field.
*	If the jury officer has multi-court access, then a court has been selected.
*	A courtroom has been selected from the auto-complete field.

## 3.3.6 Request objects
`bureau/server/objects/create-trial.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| courtroomsObject | `GET moj/trial/courtrooms/list` | Fetches a list of courtrooms available to for the user to create a trial using. | `CourtroomsListDTO` |
| judgesObject | `GET moj/trial/judge/list` | Fetches a list of judges available to for the user to create a trial using. | `JudgeListDTO` |
| createTrialObject | `POST moj/trial/create` | Creates a trial, returning the summary of created trials details | `TrialSummaryDTO` |

## 3.3.7 Utilities
* `trialPayloadBuilder()` - This helper function takes in the body of the create a trial form along with the judges and courtrooms lists, creating and returing a payload in the correct format to be sent to the backend to create a trial using the `createTrialObject` request object.

## 3.3.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.3.9 Exceptions
* Failed to fetch judges or courtrooms list
* Failed to create a new trial

## 3.3.10 Templates
`bureau/client/templates/trial-management/create-trial.njk`

This templates renders a variety of inputs for the user to enter the trial to be created's details.
* Free text input for case number.
* Radio buttons for trial type with corresponding conditonal free text inputs for dependants/respondents.
* Date picker input for trial start date.
* Auto-complete for the judge entry.
* Radio buttons for court with corresponding conditonal auto-complete inputs for designated courtroom.
* Checkbox to mark whether trial is protected or not.

## 3.3.11 Sequence diagram
![](../../../../umls/create-trial.svg)

# 3.4 Processing a Summons Reply
## 3.4.1 Description
This is the journey followed to process a summons submitted by a juror.

## 3.4.2 Preconditions
This journey can be accessed by both Jury and Bureau Officers and needs to be followed from a summons reply. If any user tries to visit this without coming from a summons reply page they should be redirected back and displayed an error.

## 3.4.3 Controllers
`bureau/server/routes/summons-management/process-reply/process-reply.controller.js`

| Method name | Purpose |
|-|-|
| getProcessReply() | This function renders the initial processing actions form from where the user will select how to process the summons. |
| postProcessReply() | This function gets invoked from a POST request that comes from the processing actions form. It then identifies which action was selected by the user, validating and then redirecting to the correct next step. |

## 3.4.4 Filters
N/A

## 3.4.5 Validators
`bureau/server/config/validation/summons-management.js`
`processAction();`

This validator will validate the form submitted and check if a valid process action was selected.

## 3.4.6 Request objects
N/A

## 3.4.7 Utilities
`isLateSummons()`

## 3.4.8 Validations
N/A

## 3.4.9 Exceptions
N/A

## 3.4.10 Templates
`bureau/client/templates/summons-management/process-reply.njk`

This template renders the processing actions form. This form can also be rendered in two ways, the normal version where the user gets prompted with 4 options, mark responded, defer, excuse or disqualify, and then there is the second version which is shown when a response is past its date, the user gets shown the options defer, excusal, diqualify, postpone or re-assign to an active pool.

## 3.4.11 Sequence diagram
![](../../../../umls/process-reply.svg)

# 3.5 Bulk Complete Service
## 3.5.1 Description
From the Pool Overview, complete service for multiple jurors at once. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.5.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Complete service' button.

## 3.5.3 Controllers
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

## 3.5.4 Filters
No filters are used in this flow

## 3.5.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of jurors on the Pool Overview page

`bureau/server/config/validation/complete-service.js`

This validator ensures a valid date has been input, and that the completion date is after each selected juror's service start date.

## 3.5.6 Request objects
// TODO not yet implemented

## 3.5.7 Utilities
No utilities are used in this flow.

## 3.5.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.5.9 Exceptions
None known.

## 3.5.10 Templates
`bureau/client/templates/shared/complete-service/complete-service-confirm.njk`

This template displays a date picker for selecting the completion date of the jurors service.

`bureau/client/templates/shared/complete-service/some-responded.njk`

If the user has selected some jurors who are not in a 'responded' state but also selected some who are in a 'responded' state, this template is used to display the list of jurors who are not in the 'responded' state. The user can then directly complete the service of the 'responded' jurors, or return to the pool overview.

`bureau/client/templates/shared/complete-service/none-responded.njk`

If the user has only selected jurors who are not in a 'responded' state, this template displays an error, and the user can return to the pool overview.

## 3.5.11 Sequence diagram
![](/frontend/bureau/umls/bulk-complete-service.svg)


# 3.6 Bulk Reassign
## 3.6.1 Description
From the Pool Overview, reassign multiple pool members at once to a different pool at either the same or a different court. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.6.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Reassign' button.

## 3.6.3 Controllers
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

## 3.6.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.
* `capitalizeFully` is used to format court location names to Title Case.

## 3.6.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of pool members on the Pool Overview page

`bureau/server/config/validation/pool-management.js`

This validator endures that a pool has been selected to reassign jurors to.


## 3.6.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| validateMovement | `PUT moj/manage-pool/movement/validation` | Determines if the selected pool members are valid to reassign to the target pool. | `PoolSummaryResponseDTO` |
| availablePools | `GET moj/manage-pool/available-pools/{locationCode}` | Gathers a list of available pools at given court location along with their details. | `AvailablePoolsInCourtLocationDto` |
| reassignJuror | `PUT moj/manage-pool/reassign-jurors` | Reassigns the selected pool members to the target pool. | `jurorManagementRequestDto` |

## 3.6.7 Utilities
* `matchUserCourt`
* `getLocCodeFromCourtNameOrLocation`
* `transformCourtNames`
* `sendReassignRequest()` - Sends request to API to reassign select jurors, handling any errors that may come back, and redirecting the user to pool overview screen on success.

## 3.6.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.6.9 Exceptions
* Failed to fetch available pools for reassigning a juror
* Failed to match the selected court
* Failed to check transfer validity
* Failed to reassign the juror to a different pool

## 3.6.10 Templates

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

## 3.6.11 Sequence diagram
![](/frontend/bureau/umls/bulk-reassign.svg)

# 3.7 Bulk Transfer
## 3.7.1 Description
From the Pool Overview, transfer multiple pool memebrs at once to a different court. This flow includes two additional pages, one of which is dependent on the data selected. 

## 3.7.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Transfer' button.

## 3.7.3 Controllers
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

## 3.7.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.
* `capitalizeFully` is used to format court location names to Title Case.

## 3.7.5 Validators
`bureau/server/config/validation/pool-reassign.js`

This validator checks that the user has selected a non-zero number of pool members on the Pool Overview page

`bureau/server/config/validation/juror-bulk-transfer.js`

This validator ensures that a court has been selected, and that an appropriate date has been selected for the transfer date.

## 3.7.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| validateMovement | `PUT moj/manage-pool/movement/validation` | Determines if the selected pool members are valid to transfer to the target court. | `PoolSummaryResponseDTO` |

`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorTransfer | `PUT moj/manage-pool/transfer` | Transfers the selected pool members to the target court. | `TransferPoolMembersRequestDTO` |

## 3.7.7 Utilities
* `matchUserCourt`
* `getLocCodeFromCourtNameOrLocation`
* `transformCourtNames`

## 3.7.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.7.9 Exceptions
None known.

## 3.7.10 Templates

`bureau/client/templates/juror-management/transfer-court.njk` 

This template renders an interstitial page that displays an autocomplete input to select a court, and a date picker to select a service start date

`bureau/client/templates/juror-management/transfer-court-confirm.njk` 

This template renders a confirmation screen, confirming the court the selected pool members will be selected to, and gives the user an option to confirm or cancel. 

`bureau/client/templates/pool-management/validate-movement.njk` 

If some of the pool members selected are not valid to transfer with the given settings, this page will be displayed, and will display which jurors are not valid and why. It gives the user the option to cancel, or to continue and transfer only those pool members not listed.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.7.11 Sequence diagram
![](/frontend/bureau/umls/bulk-transfer.svg)

# 3.8 Bulk Change Next Due At Court
## 3.8.1 Description
From the Pool Overview, court users can change the next due at court date of multiple pool members at once. This flow includes two additional pages. 

## 3.8.2 Preconditions
This flow starts on the [Pool Overview page](./pool-overview.md). The user selects some number of jurors using the checkboxes, and then clicks the 'Chnage next due at court' button.

## 3.8.3 Controllers
`bureau/server/routes/pool-management/pool-overview/change-next-due-at-court/change-next-due-at-court.controller.js`

| Method name | Purpose |
|-|-|
| postChangeNextDueAtCourt() | The controller invoked by the POST request from the front end form. This controller validates the jurors that have been selected, and reroutes the request to the change next due at court page. |
| getChangeNextDueAtCourtContinue() | This controller renders the interstitial page for selecting the date to change jurors next due at court date to. |
| postChangeNextDueAtCourtContinue() | This controller is invoked by the POST request from the select next due at court date page. It validates the selected date to change the next court date to, if there is a validation error then the page is refreshed with error message displaying, if the date is valid the user is rerouted to the confirm date page. |
| getChangeNextDueAtCourtConfirm() | This controller renders the page for confirming the date to change jurors next due at court date to and how many jurors have been selected. |
| postChangeNextDueAtCourtContinue() | This controller is invoked by the POST request from the confirm next due at court date page. The change next at court date API is called for the list of jurors which user is redirected back to the pool overview screen with the newly updated attendance dates. |

## 3.8.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.

## 3.8.5 Validators
`bureau/server/config/validation/change-attendance-date.js`

* `jurorSelect()` - This validator checks that the user has selected a non-zero number of pool members on the Pool Overview page
* `bulkAttendanceDate()` - This validator ensures that the date selected is valid, in the correct format, and in the future.

## 3.8.6 Request objects
`bureau/server/objects/juror-attendance.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| changeNextDueAtCourtDTO | `PATCH moj/juror-management/attendance/attendance-date` | Changes the next due at court date for the provided list of jurors at specified pool. | `UpdateAttendanceDateDTO` |

## 3.8.7 Utilities
N/A

## 3.8.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.8.9 Exceptions
* Failed to change attendance dates for juror(s)

## 3.8.10 Templates

`bureau/client/templates/pool-management/change-next-due-at-court/change-next-due-at-court` 

This template renders an interstitial page that displays a date pickerfor the user ot sleect next due at court date, which can be confirmed using the form buttons at the bottom.

`bureau/client/templates/pool-management/change-next-due-at-court/change-next-due-at-court` 

This template renders a page confirming the dettails selected by the user, which can be confirmed using the form buttons at the bottom. 

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.8.11 Sequence diagram
![](../../../../../umls/bulk-change-next-due-at-court.svg)

# 3.9 Approve Expenses
## 3.9.1 Description
From the either the approve expenses page, the user will be shown a table of expenses pending apporval, of which they can select and approve. 

## 3.9.2 Preconditions
This flow starts on the from the Home Page, then navigate to juror manangement module, selecting the approve expenses tab.

## 3.9.3 Controllers
`bureau/server/routes/juror-management/approve-expenses/approve-expenses.controller.js`

| Method name | Purpose |
|-|-|
| getApproveExpenses() | This controller makes a call to the expenses for approval API and then renders the page for selecting the expenses to approve. |
| postApproveExpenses() | This controller is invoked by the POST request from the approve expenses page. It validates that the user has selected at least one and then calls the approve expenses API, if any of the expenses have been submitted by the user, the getCannotApprove() method is called. Otherwise the page is refreshed showing a banner message and the newly updated for approval table. |
| getCannotApprove() | This controller renders the page showing the user that they cannot approve some of the expenses they have selected. |
| postCannotApprove() | If the user has still selected some jurors that can be approved then this controller is invoked by the POST request from the cannot approve page, calling the approve expenses API, and redirecting back to the initial approve expenses page. |

## 3.9.4 Filters
N/A

## 3.9.5 Validators
`bureau/server/config/validation/approve-expenses.js`

This validator ensures that the user has entered 2 well formed dates to filter expenses by.

## 3.9.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| approveExpensesDAO | `GET moj/expenses/approval/{locCode}/{paymentMethod}` | Fetches the records of expenses to be approved, filtered by BACS or CASH. | `PendingApprovalDTO` |
| approveExpensesDAO | `POST moj/expenses/approve` | Approves the supplied list of the expenses. | N/A |

## 3.9.7 Utilities
urlBuilder() - Builds the query params to be added on to url's for this flow.

## 3.9.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.9.9 Exceptions
* Unable to fetch approval expenses data
* Unable to approve selected expenses

## 3.9.10 Templates

`bureau/client/templates/expenses/approve-expenses/approve-expenses.njk` 

This template renders a page with a detials object which contains two date picker fields to select dates to filter the approvals list, along with a selectable row table with the detials of all records for approval.

`bureau/client/templates/expenses/approve-expenses/cannot-approve.njk` 

This template renders a page to show the user cannot approve all of the selected jurors, along with buttons to process the remaining or go back.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.9.11 Sequence diagram
![](/umls/approve-expenses.svg)

# 3.10 Add Default Expenses
## 3.10.1 Description
From the either the juror record expenses tab or the draft expense record page, add/change the jurors default expenses. This flow includes one additional page. 

## 3.10.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Expenses tab](../../juror-record/expenses) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user clicks add or change efault expenses.

## 3.10.3 Controllers
`bureau/server/routes/juror-management/expenses/expenses.controller.js`

| Method name | Purpose |
|-|-|
| getDefaultExpenses() | This controller makes a call to the default expenses summary API and then renders the page for inputing/updating the jurors default expenses. |
| postDefaultExpenses() | This controller is invoked by the POST request from the default expenses page. It validates the all of the details entered and then calls the default expenses API, redirecting back to the inital page the user began this journey from. |

## 3.10.4 Filters
N/A

## 3.10.5 Validators
`bureau/server/config/validation/default-expenses.js`

This validator ensures the following;
* If loss of earnings is not empty, then it does not contain any letters or special characters.
* If either time fields are empty, then they do not contain any letters or special characters. If minutes are entered that the value is beteen 0 and 59.
* If mileage is entered, then it must be a whole number and not contain any letters or special characters.
* If smartcard is entered, then it is 20 characters or less.

## 3.10.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| defaultExpensesDAO | `GET moj/expenses/default-summary/{jurorNumber}` | Fetches the current values for jurors default expenses. | `DefaultExpenseResponseDTO` |
| defaultExpensesDAO | `post moj/expenses/set-default-expenses/{jurorNumber}` | Sets the default expense value for given juror number. | `DefaultExpenseResponseDTO` |

## 3.10.7 Utilities
N/A

## 3.10.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.10.9 Exceptions
* Failed to fetch jurors default expenses
* Failed to set default expenses

## 3.10.10 Templates

`bureau/client/templates/expenses/default-expenses.njk` 

This template renders a page with a number of fields to enter the jurors default expense values, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.10.11 Sequence diagram
![](/umls/add-default-expenses.svg)

# 3.11 Add non-attendance day
## 3.11.1 Description
From the either the juror record attendance tab or the draft expense record page, add a non-attendance day for the juror. This flow includes one additiona page. 

## 3.11.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Attendance tab](../../juror-record/attendance) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user selects some number of jurors using the checkboxes, and then clicks the 'Reassign' button.

## 3.11.3 Controllers
`bureau/server/routes/juror-management/expenses/non-attendance-day/non-attendance-day.controller.js`

| Method name | Purpose |
|-|-|
| getNonAttendanceDay() | This controller renders the page for selecting a date to add a non-attendnace day for the juror. |
| postNonAttendanceDay() | This controller is invoked by the POST request from the select date page. It validates the date entered and then calls the non-attendance date API, redirecting back to the inital page the user began this journey from. |

## 3.11.4 Filters
`burau/server/components/filters`

* `dateFilter` is used to format dates used in the flow.

## 3.11.5 Validators
`bureau/server/config/validation/non-attendance-day.js`

This validator ensures that the date selected is valid, and in the correct format.

## 3.11.6 Request objects
`bureau/server/objects/pool-management.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorNonAttendanceDao | `POST moj/juror-management/non-attendance` | Adds a non atendance day for given juror and date. | N/A |

## 3.11.7 Utilities
* N/A

## 3.11.8 Validations
The post function uses BE validation to show error states if the selected date is already an attendance date or the date is before the service start date.

## 3.11.9 Exceptions
* Failed to add a non-attendance day for juror

## 3.11.10 Templates

`bureau/client/templates/juror-management/non-attendance-day.njk` 

This template renders a page with a date picker input to select the non-attendance date, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.11.11 Sequence diagram
![](/umls/add-non-attendance-day.svg)

# 3.12 Edit Bank Details
## 3.12.1 Description
From the either the juror record expenses tab or the draft expense record page, add/change the jurors bank details. This flow includes one additional page. 

## 3.12.2 Preconditions
<!-- UPDATE THE LINKS IN THIS SECTION ONCE OTHER MD FILES COMPLETED. -->
This flow starts on the [Juror Record Expenses tab](../../juror-record/expenses) or [Draft Expense Record page](../../unpaid-attendance/expense-record/expense-record-draft). The user clicks add or change bank details.

## 3.12.3 Controllers
`bureau/server/routes/juror-management/expenses/edit-bank-details/edit-bank-details.controller.js`

| Method name | Purpose |
|-|-|
| getBankDetails() | This controller makes a call to the bank details API and then renders the page for inputing/updating the jurors bank details. |
| postBankDetails() | This controller is invoked by the POST request from the bank details page. It validates the all of the details entered and then calls the bank details API, redirecting back to the inital page the user began this journey from. |

## 3.12.4 Filters
N/A

## 3.12.5 Validators
`bureau/server/config/validation/bank-details.js`

This validator ensures the following;
* Account number must be 8 digits exactly, cannot be empty, no letters or special characters.
* Sort code must be 6 digits exactly, cannot be empty, no letters or special characters.
* Account holder's name cannot be longer than 18 characters, and must not contain full stops, commas, or double quotes.


## 3.12.6 Request objects
`bureau/server/objects/expenses.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorBankDetailsDAO | `GET moj/juror-record/bank-details` | Fetches the current bank details for the given juror. | `BankDetailsResponseDTO` |
| jurorBankDetailsDAO | `PATCH moj/juror-record/update-bank-details` | Sets the bank details for given juror number. | N/A |

## 3.12.7 Utilities
N/A

## 3.12.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.12.9 Exceptions
* Failed to fetch jurors bank details
* Failed to set jurors bank details

## 3.12.10 Templates

`bureau/client/templates/expenses/bank-details.njk` 

This template renders a page with a number of fields to enter the jurors bank details, with a group of form buttons to submit the entered date.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.12.11 Sequence diagram
![](/umls/edit-bank-details.svg)

# 3.13 Approve Created Juror
## 3.13.1 Description
From the Approve Juror page, this flow allows a Senior Jury Officer to approve or reject a manually created juror. This flow includes one interstitial page.

## 3.13.2 Preconditions
From the Approve Juror page, the user clicks on the 'Pending approval' status on the appropriate row in the juror table. This flow is only available to Senior Jury Officers, and is not accessible to other users.

## 3.13.3 Controllers
`bureau/server/routes/juror-management/manage-jurors.controller.js`

| Method name | Purpose |
|-|-|
| getApproveReject() | This controller renders the form to accept or reject a manually created juror. |
| postApproveReject() | This controller is invoked from the accept or reject form, and handles the response. If the response is not valid, it redirects to the form. |

## 3.13.4 Filters
This flow does not use any filters.

## 3.13.5 Validators
`bureau/server/config/validation/jurorSelectValidator.js`

This validator ensures that an option has been selected on the form, and if the juror is to be rejected, ensures there is a comment supplied.

## 3.13.6 Request objects
// TODO: not yet implemented.
`bureau/server/objects/requset-object.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| objectName | `METHOD moj/route/called` | Request object purpose | `ResponseObjectDTO` |

## 3.13.7 Utilities
This flow does not use any utility functions.

## 3.13.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.13.9 Exceptions
There are no known exceptions.

## 3.13.10 Templates
`bureau/client/templates/juror-management/manage-jurors/approve-or-reject.njk`

This template renders the form to accept or reject a manually created juror.

## 3.13.11 Sequence diagram
![](/frontend/bureau/umls/approve-manual-juror.svg)

# 3.14 Manual Police Check
## 3.14.1 Description
From a juror's record, a jury officer has the ability to manually run a police check if one has yet to be run or there has been an error during a previous check. This flow includes one additional page.

## 3.14.2 Preconditions
This flow starts on the [Juror Record Overview page](./juror-record-overview.md). A jury officer clicks the 'Run a police check' link.

## 3.14.3 Controllers
`bureau/server/routes/juror-management/police-check/juror-police-check.controller.js`

| Method name | Purpose |
|-|-|
| getRunPoliceCheck() | This controller renders the interstitial page for to confirm the jury officer wants to run a police check for the selected juror. |
| postRunPoliceCheck() | The controller invoked by the POST request from the confirm police check screen, sending a patch request to the API to begin running a police check. |

## 3.14.4 Filters
N/A

## 3.14.5 Validators
N/A

## 3.14.6 Request objects
`bureau/server/objects/police-check.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| manualPoliceCheck | `PATCH moj/pnc/manual` | Manually runs a police check for a given juror number. | N/A |

## 3.14.7 Utilities
N/A

## 3.14.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.14.9 Exceptions
* Failed to run police check

## 3.14.10 Templates

`bureau/client/templates/juror-management/run-police-check.njk` 

This template renders an interstitial page that displays a button to allow the user to 'run police check' or cancel and go back to the juror record.

`bureau/client/templates/_errors/generic.njk` 

A generic error page used in case of an unknown exception from the API.

## 3.14.11 Sequence diagram
![](../../../../umls/manual-police-check.svg)



# 4.0 Helper Functions
This section details the helper functions that exist in the application.

