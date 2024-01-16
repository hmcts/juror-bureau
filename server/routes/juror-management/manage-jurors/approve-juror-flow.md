# 3.0 Approve Created Juror
## 3.0.1 Description
From the Approve Juror page, this flow allows a Senior Jury Officer to approve or reject a manually created juror. This flow includes one interstitial page.

## 3.0.2 Preconditions
From the Approve Juror page, the user clicks on the 'Pending approval' status on the appropriate row in the juror table. This flow is only available to Senior Jury Officers, and is not accessible to other users.

## 3.0.3 Controllers
`bureau/server/routes/juror-management/manage-jurors.controller.js`

| Method name | Purpose |
|-|-|
| getApproveReject() | This controller renders the form to accept or reject a manually created juror. |
| postApproveReject() | This controller is invoked from the accept or reject form, and handles the response. If the response is not valid, it redirects to the form. |

## 3.0.4 Filters
This flow does not use any filters.

## 3.0.5 Validators
`bureau/server/config/validation/jurorSelectValidator.js`

This validator ensures that an option has been selected on the form, and if the juror is to be rejected, ensures there is a comment supplied.

## 3.0.6 Request objects
// TODO: not yet implemented.
`bureau/server/objects/requset-object.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| objectName | `METHOD moj/route/called` | Request object purpose | `ResponseObjectDTO` |

## 3.0.7 Utilities
This flow does not use any utility functions.

## 3.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 3.0.9 Exceptions
There are no known exceptions.

## 3.0.10 Templates
`bureau/client/templates/juror-management/manage-jurors/approve-or-reject.njk`

This template renders the form to accept or reject a manually created juror.

## 3.0.11 Sequence diagram
![](/frontend/bureau/umls/approve-manual-juror.svg)