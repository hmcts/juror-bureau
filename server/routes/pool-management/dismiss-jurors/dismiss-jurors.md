# X.0 Dismiss jurors
## X.0.1 Description
This page allows the officers to dismiss jurors from a random selection of jurors.
The list of jurors is randomly selected, from pre-selected pools following certain conditions selected by the officer.
The jurors selected by the officer are not random, but the list presented is indeed random.

## X.0.2 Preconditions
The officer needs to have available a selection of active pools to select and generate a list of random jurors from.

## X.0.3 Controllers
`bureau/server/routes/pool-management/dismiss-jurors/dismiss-jurors.controller.js`

| Method name | Purpose |
|-|-|
| getDismissJurorsPools() | Renders the list of pools and form of other options available for the officer. |
| postDismissJurorsPools() | Posts the form with selected pools, the number of jurors to generate a list and the options for this list. |
| getJurorsList() | Renders the list of jurors available to dismiss. |
| postJurorsList() | Posts the form with the selected jurors to dimiss. |
| getCompleteService() | Renders the page with the datepicker to select a date to complete the service with. |
| postCompleteService() | Posts the selected data to complete the service. |
| getCheckOutJurors() | Renders the list of jurors that are still not checked out. Also renders a time input for to enter a time for checkout. |
| postCheckOutJurors() | Posts the checkout time for the not-checked out jurors. |
| postCheckJuror() | Posts the select state for the targeted juror. This is only available on the list of jurors. |

## X.0.4 Filters
`convertAmPmToLong()`
`dateFilter()`
`timeArrayToString()`
`convert12to24()`

## X.0.5 Validators
| Validator function | Purpose |
|-|-|
| jurorsToDismiss() | Validate the number of jurors to generate a random list from. |
| completeService() | Validate the date to complete the service. |
| checkOutTime() | Validate the checkout time for the jurors still not checked out. |

## X.0.6 Request objects
`bureau/server/objects/request-pool.js`
| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| fetchPoolsAtCourt | `GET moj/pool-request/pools-at-court` | Fetches a list of all active pools at a location for court users. | PoolsAtCourtLocationListDto |

`bureau/server/objects/dismiss-jurors.js`
| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| getJurorsObject | `GET moj/juror-management/jurors-to-dismiss` | Fetches a list of random jurors to dismiss given the selected criteria. | JurorsToDismissResponseDto |
| dismissJurorsObject | `PATCH moj/complete-service/dismissal` | Comlpetes services and dismisses selected jurors. | N/A |

`bureau/server/objects/juror-attendance.js`
| Request object | Call signature | Purpose | Response object |
|-|-|-|-|
| jurorAttendanceDao | `GET moj/juror-management/attendance` | Retrieve a list of juror attendance details based on attendance (appearance) status. | AttendanceDetailsResponseDto |
| jurorAttendanceDao | `PATCH moj/juror-management/attendance` | Update the list of jurors based on their attendance (appearance) status. | AttendanceDetailsResponseDto |

## X.0.7 Utilities
* `constants`
* `paginationBuilder()`
* `totalCurrentlySelected()` - Returns how many pools are selcted on initial screen
* `calculateTotalJurorsAvailable()` - Calculates how many jurors are available to dismiss based on the selections made
* `paginateJurorsList()` - Slices the jurors list to fit within the 25 limit based on the current page
* `compareCheckInAndCheckOutTimes()` - Returns whether the check out time entered is after the checxk in time for each juror

## X.0.8 Exceptions
* Failed to fetch pools to dismiss jurors from
* Failed to fetch jurors to dismiss
* Failed to dismiss the selected jurors
* Failed to checkout the selected jurors

## X.0.10 Templates
`bureau/client/templates/pool-management/dismiss-jurors/pools-list.njk`
This template displays the list of pools and options that the officer can select for generating a random list of jurors to dismiss.

`bureau/client/templates/pool-management/dismiss-jurors/pools-table.njk`
This template is partial and just displays the table of pools for the template above.

`bureau/client/templates/pool-managementdismiss-jurors/jurors-list.njk`
This template displays the list of jurors that the jury officer has available to dismiss. This also changes with pagination.

`bureau/client/templates/pool-management/dismiss-jurors/jurors-table.njk`
This template is partial and just displays the table of jurors avaiable to dismiss from.

`bureau/client/templates/pool-management/dismiss-jurors/complete-service.njk`
This template displays a datepicker that the jury officer can use to select a date to complete the jurors service with.

`bureau/client/templates/pool-management/dismiss-jurors/check-out.njk`
This template displays the list of jurors still not checked out and a time input form to enter a checkout time. It allows the officer to post the time and checkout the jurors listed.

## X.0.11 Sequence diagram
![](../../../../umls/dismiss-jurors.svg)