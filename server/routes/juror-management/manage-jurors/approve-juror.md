# 2.0 Approve Jurors page
## 2.0.1 Description
This page allows Senior Jury Officers to view and approve jurors who have been manually created, as well has a historic list of created jurors.

## 2.0.2 Preconditions
The Approve Jurors page can be found in the Juror Management app. It is accessible from the navigation bar.

// TODO
It can also be accessed by relevant users from the notifications on the home page.

// TODO
It should only be visible and accessible to Senior Jury Officers, who are identified in a manner to be determined.

## 2.0.3 Controllers
`bureau/server/routes/juror-management/manage-jurors.controller.js`

| Method name | Purpose |
|-|-|
| getApprove() | Renders the page. |

## 2.0.4 Filters
No filters are used in this page.

## 2.0.5 Validators
// TODO: This isn't relevant for pages? Maybe we need more-different template?

## 2.0.6 Request objects
// TODO: Not yet implemented
`bureau/server/objects/requset-object.js`

| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| objectName | `METHOD moj/route/called` | Request object purpose | `ResponseObjectDTO` |

## 2.0.7 Utilities
No utilities are used.

## 2.0.8 Validations
// TODO covered in 3.0.5, drop this section?

## 2.0.9 Exceptions
None known.

## 2.0.10 Templates
`bureau/client/templates/juror-management/manage-jurors/approve-jurors.njk`

This template returns a list of pending jurors, and allows the user to toggle views between pending jurors and all created jurors within the retention window.

`bureau/client/js/components/approval-toggle.js` // TODO: Should this be in its own section?

This code supports the view by setting up handlers to switch between the two sets of views. If javascript is disabled, it will display all created jurors, including historical ones.

## 2.0.11 Sequence diagram
![](/frontend/bureau/umls/approve-juror-page.svg)