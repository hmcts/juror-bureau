(() => {
  'use strict';

  const _ = require('lodash');
  const { isCourtUser } = require('../../../components/auth/user-type');
  const { dateFilter, capitalizeFully, toMoney } = require('../../../components/filters');
  const { dailyUtilisationDAO, dailyUtilisationJurorsDAO, viewMonthlyUtilisationDAO, generateMonthlyUtilisationDAO } = require('../../../objects/reports');

  const makeLink = (app) => {
    return {
      poolNumber: (poolNumber) => {
        return `<a class='govuk-link' href='${app.namedRoutes.build('pool-overview.get', {poolNumber: poolNumber})}'>Pool ${poolNumber}</a>`
      }
    }
  }

  // type IReportKey = {[key:string]: {
  //   title: string,
  //   apiKey: string,
  //   search?: 'poolNumber' | 'dateRange', // etc only poolNumber is currently implemented
  //   searchLabelMappers: {
  //     dateFrom: string, // custom label for date from input 
  //     dateTo: string, // custom label for date to input 
  //   },
  //   queryParams?: { // any mandatory query params neederd throughout report journey 
  //     key: value,
  //   },
  //   bespokeReport?: {
  //     dao?: (req) => Promise<any>,                                 // custom data access function
  //     insertColumns?: {[key: number]: [string, (data, isPrint) => string]}, // column header, body
  //     printInsertColumns?: boolean, // should insertColumns be included in pdf print (logic added to insertColumns)
  //     insertRows?: {[key: number]: (data, isPrint) => [object]}, // row to be added within each table, 
  //                                                                // key specifies position ('last' will append to end of each table)
  //     printInsertRows?: boolean, // should insertRows be included in pdf print (logic added to insertRows)
  //     insertTables?: {[key: number]: (data, isPrint) => [object]}, // table to be added to report,
  //                                                                  // key specifies position ('last' will append to end of the report)
  //     printInsertRows?: boolean, // should insertRows be included in pdf print (logic added to insertRows)
  //     printWidths?: [string], // custom widths for pdf printing tables
  //     body?: boolean, // fully bespoke report body
  //     file?: string, // bespoke nunjucks file route to handle body
  //     tableHeadClasses?: [string], // classes to be added to each table header in order i.e. size classes
  //   },
  //   headings: string[], // corresponds to the ids provided for the headings in the API
  //                       // (except report created dateTime)
  //   unsortable?: boolean, // prevents report table from being sorted
  //   exportLabel?: string, // label for export button if required
  //   multiTable?: {  // include if there is multiple standard tables within one report
  //     sectionHeadings?: boolean, // show section headings provided by DTO
  //   },
  //   grouped?: {
  //     headings: {
  //       transformer?: (data: string, isPrint: boolean) => string, // transform the group header
  //     },
  //     groupHeader?: boolean, // display the group header or not.. in some reports we dont have to
  //     totals?: boolean, // same on this one.. some reports dont need the totals
  //     emptyDataGroup?: (colSpan, isPrint) => [object],  // returns table to display if a group has no data
  //     sortGroups?: 'ascending' or 'descending',  // orders each group by group header,
  //   },
  //   printLandscape?: boolean, // force report printing to landscape
  //   largeTotals?: {
  //     values: (data) => {label: string, value: string}[], // large totals for the report
  //     printWidths?: [string], // optional widths for the individual tags when printing, if left empty will stretch across page
  //   },
  //   fontSize?: number,
  //   totalsRow?: (data, isPrint) => [object], // custom totals row for the report
  // }};
  module.exports.reportKeys = (app, req = null) => {
    const courtUser = req ? isCourtUser(req) : false;

    return {
      'next-due': {
        title: 'Next attendance date report',
        apiKey: 'NextAttendanceDayReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
        ],
      },
      'undelivered': {
        title: 'Undelivered list',
        apiKey: 'UndeliverableListReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalUndelivered',
        ],
      },
      'non-responded': {
        title: 'Non-responded list',
        apiKey: 'NonRespondedReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalNonResponded',
        ],
      },
      'postponed-pool': {
        title: 'Postponed list (by pool)',
        apiKey: 'PostponedListByPoolReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalPostponed',
        ],
        backUrl: app.namedRoutes.build('reports.postponed.search.get'),
      },
      'postponed-date': {
        title: 'Postponed list (by date)',
        apiKey: 'PostponedListByDateReport',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          'totalPostponed',
        ].concat(courtUser ? ['courtName'] : []),
        grouped: {
          headings: {
            transformer: (data, isPrint) => {
              if (isPrint) {
                return `Pool ${data}`;
              }
              return makeLink(app)['poolNumber'](data);
            },
          },
          groupHeader: true,
          totals: true,
        },
        backUrl: app.namedRoutes.build('reports.postponed.search.get'),
      },
      'incomplete-service': {
        title: 'Incomplete service',
        apiKey: 'IncompleteServiceReport',
        search: 'date',
        bespokeReport: {
          insertColumns: {
            6: ['', (data, isPrint = false) => {
              return isPrint ? {} : { html: `<a href=${
                app.namedRoutes.build('reports.incomplete-service.complete-redirect.get', {
                  jurorNumber: data.jurorNumber,
                  lastAttendanceDate: data.lastAttendanceDate ? data.lastAttendanceDate : null,
                })
              }>Complete service</a>`};
            }],
          },
        },
        headings: [
          'cutOffDate',
          'reportDate',
          'totalIncompleteService',
          'reportTime',
          '',
          'courtName',
        ],
      },
      'current-pool-status': {
        title: 'Current pool status report',
        apiKey: 'CurrentPoolStatusReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalPoolMembers',
        ],
        printLandscape: true,
      },
      'panel-summary': {
        title: 'Panel list (summary)',
        apiKey: 'PanelSummaryReport',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'courtRoom',
          'courtName',
          'judge',
        ],
      },
      'bulk-print-audit': {
        title: 'Bulk-print audit report',
        apiKey: 'AbaccusReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
        ],
      },
      'panel-detail': {
        title: 'Panel list (Detail)',
        apiKey: 'PanelListDetailedReport',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'courtRoom',
          'courtName',
          'judge',
        ],
      },
      'jury-list': {
        title: 'Jury list',
        apiKey: 'JuryListReport',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'trialStartDate',
          'courtName',
          'courtRoom',
          '',
          'judge',
        ],
      },
      'pool-status': {
        title: 'Pool status report',
        apiKey: 'PoolStatusReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'totalPoolMembers',
          'reportTime',
          'totalRequestedByCourt',
        ],
        bespokeReport: {
          body: true,
          file: './bespoke-report-body/pool-status.njk',
        },
        exportLabel: 'Export data',
      },
      'reasonable-adjustments': {
        title: 'Reasonable adjustments report',
        apiKey: 'ReasonableAdjustmentsReport',
        search: 'fixedDateRange',
        headings: [
          'totalReasonableAdjustments',
          'reportDate',
          '',
          'reportTime',
          '',
          'courtName',
        ],
        grouped: {
          groupHeader: !courtUser,
          totals: !courtUser,
        },
        printLandscape: true,
      },
      'persons-attending-summary': {
        title: 'Persons attending (summary)',
        apiKey: 'PersonAttendingSummaryReport',
        search: 'date',
        queryParams: {
          includeSummoned: req?.query?.includeSummoned || false,
        },
        headings: [
          'attendanceDate',
          'reportDate',
          'totalDue',
          'reportTime',
          '',
          'courtName',
        ],
      },
      'persons-attending-detail': {
        title: 'Persons attending (detailed)',
        apiKey: 'PersonAttendingDetailReport',
        search: 'date',
        queryParams: {
          includeSummoned: req?.query?.includeSummoned || false,
        },
        headings: [
          'attendanceDate',
          'reportDate',
          'totalDue',
          'reportTime',
          '',
          'courtName',
        ],
        grouped: {
          headings: {
            transformer: (data, isPrint) => {
              if (isPrint) {
                return `Pool ${data}`;
              }
              return makeLink(app)['poolNumber'](data);
            },
          },
          groupHeader: true,
          totals: true,
        },
        bespokeReport: {
          insertColumns: {
            5: ['', (data, isPrint = false) => {
              return isPrint ? { text: `*${data.jurorNumber}*`, style: 'barcode' } : { text: `*${data.jurorNumber}*`, classes: 'mod-barcode' };
            }],
          },
          printInsertColumns: true,
          printWidths: ['10%', '10%', '10%', '*', '*', 'auto'],
        },
      },
      'daily-utilisation': {
        title: 'Daily wastage and utilisation report',
        apiKey: 'DailyUtilisationReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          '',
          'courtName',
        ],
        bespokeReport: {
          dao: () => dailyUtilisationDAO.get(
            req,
            req.session.authentication.locCode,
            req.query.fromDate,
            req.query.toDate
          ),
          body: true,
        },
        unsortable: true,
        exportLabel: 'Export raw data',
      },
      'daily-utilisation-jurors': {
        title: 'Daily wastage and utilisation report - jurors',
        bespokeReport: {
          dao: () => dailyUtilisationJurorsDAO.get(
            req,
            req.session.authentication.locCode,
            req.params.filter
          ),
          body: true,
        },
        headings: [
          'date',
          'reportDate',
          '',
          'reportTime',
          '',
          'courtName',
        ],
        unsortable: true,
        exportLabel: 'Export raw data',
      },
      'unconfirmed-attendance': {
        title: 'Unconfirmed attendance report',
        apiKey: 'UnconfirmedAttendanceReport',
        search: 'dateRange',
        headings: [
          'totalUnconfirmedAttendances',
          'reportDate',
          '',
          'reportTime',
          '',
          'courtName',
        ],
        grouped: {
          headings: {
            transformer: (data, isPrint) => {
              const [attendanceDate, poolType] = data.split(',');
              const formattedAttendanceDate = dateFilter(attendanceDate, 'YYYY-mm-dd', 'dddd D MMMM YYYY');

              if (isPrint) {
                return formattedAttendanceDate;
              }

              return `${formattedAttendanceDate} <span class="grouped-display-inline">${capitalizeFully(poolType)}</span>`;
            },
          },
          groupHeader: true,
          totals: true,
        },
      },
      'panel-members-status': {
        title: 'Panel members status report',
        apiKey: 'PanelMembersStatusReport',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'courtRoom',
          'courtName',
          'judge',
        ],
        largeTotals: {
          values: (data) => {
            return [
              { label: 'Panelled', value: data.length },
              { label: 'Empanelled', value: data.filter(juror => juror.panelStatus === 'Juror').length },
              {
                label: 'Not used',
                value: data.filter(juror => (juror.panelStatus === 'Not Used' || juror.panelStatus === 'Returned')).length,
              },
              { label: 'Challenged', value: data.filter(juror => juror.panelStatus === 'Challenged').length },
              { label: 'Returned jurors', value: data.filter(juror => juror.panelStatus === 'Returned Juror').length },
            ];
          },
        },
      },
      'prepare-monthly-utilisation': {
        title: 'Monthly wastage and utilisation report',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          '',
          'courtName',
        ],
        bespokeReport: {
          dao: (req) => generateMonthlyUtilisationDAO.get(
            req,
            req.session.authentication.locCode,
            req.params.filter,
          ),
          body: true,
        },
        unsortable: true,
        exportLabel: 'Export raw data',
      },
      'view-monthly-utilisation': {
        title: 'View monthly wastage and utilisation report',
        queryParams: {
          previousMonths: req?.query?.previousMonths || false,
        },
        headings: [
          'courtName',
          'reportDate',
          '',
          'reportTime',
        ],
        bespokeReport: {
          dao: (req) => viewMonthlyUtilisationDAO.get(
            req,
            req.session.authentication.locCode,
            req.params.filter,
            req.query.previousMonths
          ),
          body: true,
        },
        unsortable: true,
        exportLabel: 'Export raw data',
      },
      'jury-expenditure-high-level': {
        title: 'Juror expenditure report (high-level)',
        apiKey: 'JurorExpenditureReportHighLevelReport',
        search: 'dateRange',
        searchLabelMappers: {
          dateFrom: 'Date expenses approved from',
          dateTo: 'Date expenses approved to',
        },
        headings: [
          'approvedFrom',
          'reportDate',
          'approvedTo',
          'reportTime',
          '',
          'courtName',
        ],
        bespokeReport: {
          body: true,
        },
      },
      'jury-expenditure-mid-level': {
        title: 'Juror expenditure report (mid-level)',
        apiKey: 'JurorExpenditureReportMidLevelReport',
        search: 'dateRange',
        searchLabelMappers: {
          dateFrom: 'Date expenses approved from',
          dateTo: 'Date expenses approved to',
        },
        headings: [
          'approvedFrom',
          'reportDate',
          'approvedTo',
          'reportTime',
          'totalBacsAndCheque',
          'courtName',
          'totalCash',
          '',
          'overallTotal',
        ],
        bespokeReport: {
          body: true,
        },
      },
      'jury-expenditure-low-level': {
        title: 'Juror expenditure report (low-level)',
        apiKey: 'JurorExpenditureReportLowLevelReport',
        search: 'dateRange',
        searchLabelMappers: {
          dateFrom: 'Date expenses approved from',
          dateTo: 'Date expenses approved to',
        },
        headings: [
          'approvedFrom',
          'reportDate',
          'approvedTo',
          'reportTime',
          'totalApprovals',
          'courtName',
          'totalBacsAndCheque',
          '',
          'totalCash',
          '',
          'overallTotal',
        ],
        multiTable: {
          sectionHeadings: true,
        },
        grouped: {
          groupHeader: true,
          headings: {
            transformer: (data) => dateFilter(data, 'yyyy-MM-DD', 'dddd D MMM YYYY'),
          },
          emptyDataGroup: (colspan, isPrint = false) => {
            if (isPrint) {
              const group = [[
                {
                  text: 'No payments authorised',
                  color: '#505A5F',
                  colSpan: colspan
                },
              ]];
              for (let i = 0; i < colspan - 1; i++) {
                group[0].push({});
              }
              return group;
            }
            return [[
              {
                text: 'No payments authorised',
                classes: 'govuk-hint mod-table-no-border',
                colspan: colspan
              },
            ]];
          },
        },
        bespokeReport: {
          tableHeadClasses: [
            'mod-!-width-one-eighth',
            'mod-!-width-one-eighth', 
            'mod-!-width-one-eighth',
            'mod-!-width-one-eighth',
            'mod-!-width-one-eighth',
            'mod-!-width-one-eighth',
            'mod-!-width-three-twentyfifths',
            'mod-!-width-three-twentyfifths',
            'mod-!-width-three-twentyfifths'
          ],
          insertRows: {
            last: (data, isPrint = false) => {
              let total = 0;
              if (!data.length) {
                return [];
              }

              data.forEach((juror) => {
                total += juror.totalApprovedSum;
              });
              return isPrint ? [
                {
                  text: 'Daily sub total', colSpan: 8, bold: true, fillColor: '#F3F2F1',
                },
                {}, {}, {}, {}, {}, {}, {},
                {
                  text: toMoney(total), bold: true, fillColor: '#F3F2F1',
                },
              ] : [
                {
                  text: 'Daily sub total',
                  colspan: 8,
                  classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                },
                {
                  text: toMoney(total),
                  classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                  format: 'numeric',
                },
              ];
            },
          },
          printInsertRows: true,
          insertTables: {
            last: (tableData, isPrint = false) => {
              let overallLossOfEarningsTotal = 0;
              let overallFoodAndDrinkTotal = 0;
              let overallSmartcardTotal = 0;
              let overallTravelTotal = 0;
              let overallTotal = 0;

              let rows = [];

              for (const [type, date] of Object.entries(tableData.data)) {
                let lossOfEarningsTotal = 0;
                let foodAndDrinkTotal = 0;
                let smartcardTotal = 0;
                let travelTotal = 0;
                let total = 0;

                for (const [day, jurors] of Object.entries(date)) {
                  jurors.forEach((juror) => {
                    lossOfEarningsTotal += juror.totalLossOfEarningsApprovedSum;
                    foodAndDrinkTotal += juror.totalSubsistenceApprovedSum;
                    smartcardTotal += juror.totalSmartcardApprovedSum;
                    travelTotal += juror.totalTravelApprovedSum;
                    total += juror.totalApprovedSum;
                  });
                }

                overallLossOfEarningsTotal += lossOfEarningsTotal;
                overallFoodAndDrinkTotal += foodAndDrinkTotal;
                overallSmartcardTotal += smartcardTotal;
                overallTravelTotal += travelTotal;
                overallTotal += total;

                if (!isPrint) {
                  rows.push([
                    {
                      text: type,
                      colspan: 4,
                      classes: 'govuk-!-padding-left-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                    },
                    {
                      text: toMoney(lossOfEarningsTotal),
                      classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(foodAndDrinkTotal),
                      classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(smartcardTotal),
                      classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(travelTotal),
                      classes: 'govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(total),
                      classes: 'govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                  ]);
                } else {
                  rows.push([
                    {
                      text: type,
                      colspan: 4,
                      bold: true, fillColor: '#F3F2F1',
                    },
                    {}, {}, {},
                    {
                      text: toMoney(lossOfEarningsTotal),
                      bold: true, fillColor: '#F3F2F1',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(foodAndDrinkTotal),
                      bold: true, fillColor: '#F3F2F1',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(smartcardTotal),
                      bold: true, fillColor: '#F3F2F1',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(travelTotal),
                      bold: true, fillColor: '#F3F2F1',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(total),
                      bold: true, fillColor: '#F3F2F1',
                      alignment: 'right',
                    },
                  ]);
                }
              }

              if (rows.length) {
                if (!isPrint) {
                  rows.push([
                    {
                      text: 'Overall total',
                      colspan: 4,
                      classes: 'govuk-!-padding-left-2 govuk-!-width-one-half govuk-!-font-weight-bold mod-highlight-table-data__blue',
                    },
                    {
                      text: toMoney(overallLossOfEarningsTotal),
                      classes: 'mod-!-width-one-eighth govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(overallFoodAndDrinkTotal),
                      classes: 'mod-!-width-one-eighth govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(overallSmartcardTotal),
                      classes: 'mod-!-width-three-twentyfifths govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(overallTravelTotal),
                      classes: 'mod-!-width-three-twentyfifths govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(overallTotal),
                      classes: 'mod-!-width-three-twentyfifths govuk-!-padding-right-2 govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      format: 'numeric',
                    },
                  ]);
                } else {
                  rows.push([
                    {
                      text: 'Overall total',
                      colspan: 4,
                      classes: 'govuk-!-padding-left-2 govuk-!-width-one-half govuk-!-font-weight-bold mod-highlight-table-data__blue',
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                    }, {}, {}, {},
                    {
                      text: toMoney(overallLossOfEarningsTotal),
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(overallFoodAndDrinkTotal),
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(overallSmartcardTotal),
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(overallTravelTotal),
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                      alignment: 'right',
                    },
                    {
                      text: toMoney(overallTotal),
                      bold: true, fillColor: '#0b0c0c', color: '#ffffff',
                      alignment: 'right',
                    },
                  ]);
                }
                return isPrint ? [
                  {
                    body: [[
                      {text: 'Totals approved for this period', style: 'largeSectionHeading'},
                    ]],
                    widths:['100%'],
                    layout: { hLineColor: '#0b0c0c' },
                    margin: [0, 10, 0, 0],
                  },
                  {
                    body: rows,
                    widths:['50%', '0%', '0%', '0%', '12.5%', '12.5%', '8.33333333333%', '8.33333333333%', '8.33333333333%'],
                    margin: [0, 0, 0, 0],
                  },
                ] : [{title: 'Totals approved for this period', headers: [], rows: rows}];
              }
              return [];
            },
          },
          printInsertTables: true,
        },
      },
      'absences': {
        title: 'Absences report',
        apiKey: 'AbsencesReport',
        search: 'dateRange',
        grouped: {
          headings: {
            transformer: (data, isPrint) => {
              const [poolNumber, poolType] = data.split(',');
              if (isPrint) {
                return [
                  `Pool ${poolNumber} `,
                  {
                    text: capitalizeFully(poolType),
                    color: '#505A5F',
                    fontSize: 10,
                    bold: false
                  }];
              }
              return `${makeLink(app)['poolNumber'](poolNumber)} <span class="grouped-display-inline">${capitalizeFully(poolType)}</span>`;
            },
          },
          totals: true,
          groupHeader: true,
        },
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          'totalAbsences',
          'courtName',
        ],
      },
      'summoned-responded': {
        title: 'Summoned and responded pool members report',
        apiKey: 'SummonedRespondedReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          '',
          'reportTime',
        ],
      },
      'trial-statistics': {
        title: 'Trial statistics',
        apiKey: 'TrialStatisticsReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
        ],
        largeTotals: {
          values:(data) => {
            const criminalTrials = data.filter(trial => trial.trialType === 'CRI');
            const civilTrials = data.filter(trial => trial.trialType === 'CIV');
            const calculateAverage = (trials) => {
              const days = trials.map((t) => t.numberOfDays) 
              const sum = days.reduce((a, b) => a + b, 0);
              const avg = (sum / trials.length) || 0;
              return `${avg} days`;
            };
            return [
              { 
                label: 'Criminal trials average length',
                value: calculateAverage(criminalTrials),
                classes: "govuk-!-margin-bottom-1 mod-large-tag__grey mod-!-width-one-eighth",
              },
              {
                label: 'Civil trials average length',
                value: calculateAverage(civilTrials),
                classes: "govuk-!-margin-bottom-1 mod-large-tag__grey mod-!-width-one-eighth",
              },
            ];
          },
          printWidths: ['20%', '20%'],
        },
      },
      'available-list-pool': {
        title: 'Available list (by pool)',
        apiKey: 'AvailableListByPoolReport',
        search: 'poolNumber',
        queryParams: {
          includeJurorsOnCall: req?.query?.includeJurorsOnCall || false,
          respondedJurorsOnly: req?.query?.respondedJurorsOnly || false,
          includePanelMembers: req?.query?.includePanelMembers || false,
        },
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalAvailablePoolMembers'
        ],
      },
      'available-list-date': {
        title: 'Available list (by date)',
        apiKey: courtUser ? 'AvailableListByDateReportCourt' : 'AvailableListByDateReportBureau',
        search: 'date',
        queryParams: {
          includeJurorsOnCall: req?.query?.includeJurorsOnCall || false,
          respondedJurorsOnly: req?.query?.respondedJurorsOnly || false,
          includePanelMembers: req?.query?.includePanelMembers || false,
        },
        backUrl: app.namedRoutes.build('reports.available-list.filter.get'),
        headings: [
          'attendanceDate',
          'reportDate',
          'totalAvailablePoolMembers',
          'reportTime',
          '',
          'courtName',
        ],
        multiTable: !courtUser ? {
          sectionHeadings: true,
        } : null,
        grouped: {
          groupHeader: true,
          headings: {
            transformer: (data, isPrint) => {
              const [poolNumber, poolType] = data.split(',');
              if (isPrint) {
                return [
                  `Pool ${poolNumber} `,
                  {
                    text: capitalizeFully(poolType),
                    color: '#505A5F',
                    fontSize: 10,
                    bold: false
                  }];
              }
              return `${makeLink(app)['poolNumber'](poolNumber)} <span class="grouped-display-inline">${capitalizeFully(poolType)}</span>`;
            },
          },
        },
      },
      'pool-analysis': {
        title: 'Pool analysis report',
        apiKey: 'PoolAnalysisReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          '',
          'courtName',
        ],
        cellTransformer: (data, key, output, isPrint) => {
          const percentageKey = _.camelCase(`${key}_percentage`);

          if (percentageKey in data) {
            if (isPrint) return `${output} (${data[percentageKey]}%)`;
            return `<span class="mod-flex mod-gap-x-1">${output} <span class="govuk-caption-m">(${data[percentageKey]}%)</span></span>`;
          }

          return output;
        },
        printLandscape: true,
        fontSize: 8,
        totalsRow: (data, isPrint = false) => {
          const calculatePercentage = (value, total) => Math.round((value / total) * 100);
          const totals = {
            jurorsSummonedTotal: 0,
            respondedTotal: 0,
            attendedTotal: 0,
            panelTotal: 0,
            jurorTotal: 0,
            excusedTotal: 0,
            disqualifiedTotal: 0,
            deferredTotal: 0,
            reassignedTotal: 0,
            undeliverableTotal: 0,
            transferredTotal: 0,
            failedToAttendTotal: 0,
          };
          
          data.forEach((row) => {
            Object.keys(totals).forEach((key) => {
              totals[key] += row[key];
            });
          });

          const htmlTemplate = (total) => {
            if (isPrint) return `${total} (${calculatePercentage(total, totals.jurorsSummonedTotal)}%)`;

            return `<span class="mod-flex mod-gap-x-1">
              ${total}<span class="govuk-caption-m">(${calculatePercentage(total, totals.jurorsSummonedTotal)}%)</span>
            </span>`;
          };

          return [
            { text: '', fillColor: '#F3F2F1' },
            { text: '', fillColor: '#F3F2F1' },
            { text: totals.jurorsSummonedTotal, bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.respondedTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.attendedTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.panelTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.jurorTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.excusedTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.disqualifiedTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.deferredTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.reassignedTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.undeliverableTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.transferredTotal), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.failedToAttendTotal), bold: true, fillColor: '#F3F2F1' },
          ]
        }
      },
      'on-call': {
        title: 'On call list',
        apiKey: 'OnCallReport',
        search: 'poolNumber',
        headings: [
          'poolNumber',
          'reportDate',
          'poolType',
          'reportTime',
          'serviceStartDate',
          'courtName',
          'totalOnCall',
        ],
      },
      'trial-attendance': {
        title: 'Trial attendance report',
        apiKey: 'TrialAttendanceReport',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'trialType',
          'courtName',
          'trialStartDate',
          '',
          'courtroom',
          '',
          'judge'
        ],
        grouped: {
          headings: {
            transformer: (data, isPrint) => {
              return dateFilter(data, 'yyyy-MM-DD', 'dddd D MMM YYYY');
            },
          },
          groupHeader: true,
        },
        bespokeReport: {
          tableHeadClasses: [
            '', '', '', '', '', '', '', '',
            'mod-!-width-one-fifteenth',
            'mod-!-width-one-fifteenth'
          ],
          insertRows: {
            last: (data, isPrint = false) => {
              let totalDue = 0;
              let totalPaid = 0;
              if (!data.length) {
                return [];
              }

              data.forEach((trial) => {
                totalDue += trial.totalDue;
                totalPaid += trial.totalPaid;
              });
              return isPrint ? [
                {}, {}, {}, {}, {}, {}, {}, {},
                {
                  text: toMoney(totalDue), bold: true,
                },
                {
                  text: toMoney(totalPaid), bold: true,
                },
              ] : [
                {
                  colspan: 8
                },
                {
                  text: toMoney(totalDue),
                  classes: 'govuk-!-font-weight-bold',
                  format: 'numeric',
                },
                {
                  text: toMoney(totalPaid),
                  classes: 'govuk-!-font-weight-bold',
                  format: 'numeric',
                },
              ];
            },
          },
          printInsertRows: true,
          insertTables: {
            last: (tableData, isPrint = false) => {
              let totalDue = 0;
              let totalPaid = 0;

              let rows = [];
              
              if (Object.entries(tableData.data).length) {
                for (const [date, trials] of Object.entries(tableData.data)) {
                  trials.forEach((trial) => {
                    totalDue += trial.totalDue;
                    totalPaid += trial.totalPaid;
                  });
                }
                if (!isPrint) {
                  rows.push([
                    {
                      colspan: 8,
                      classes: 'mod-highlight-table-data__grey',
                    },
                    {
                      text: toMoney(totalDue),
                      classes: 'mod-!-width-one-fifteenth govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                    {
                      text: toMoney(totalPaid),
                      classes: 'mod-!-width-one-fifteenth govuk-!-font-weight-bold mod-highlight-table-data__grey',
                      format: 'numeric',
                    },
                  ]);
                } else {
                  rows.push([
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {text:'', fillColor: '#F3F2F1'},
                    {
                      text: toMoney(totalDue),
                      bold: true, fillColor: '#F3F2F1',
                    },
                    {
                      text: toMoney(totalPaid),
                      bold: true, fillColor: '#F3F2F1',
                    },
                  ]);
                }
                return isPrint ? [
                  {
                    body: [[
                      {text: 'Total expenses', style: 'largeSectionHeading'},
                    ]],
                    widths:['100%'],
                    layout: { hLineColor: '#0b0c0c' },
                    margin: [0, 10, 0, 0],
                  },
                  {
                    body: rows,
                    widths:['*', '*', '*', '*', '*', '*', '*', '*', '6.667%', '6.667%'],
                    margin: [0, 0, 0, 0],
                  },
                ] : [{title: 'Totals expenses', headers: [], rows: rows}];
              }
              return [];
            }
          },
          printInsertTables: true,
          printWidths: ['*', '*', '*', '*', '*', '*', '*', '*', '6.667%', '6.667%']
        },
        printLandscape: true,
      },
      'jury-cost-bill': {
        title: 'Jury cost bill',
        apiKey: 'JuryCostBill',
        search: 'trial',
        headings: [
          'trialNumber',
          'reportDate',
          'names',
          'reportTime',
          'trialType',
          'courtName',
          'trialStartDate',
          '',
          'courtroom',
          '',
          'judge'
        ],     
        cellTransformer: (data, key, output, isPrint) => {
          if (key === 'total_paid_sum') {
            if (isPrint) return output;
            return `<b>${output}</b>`;
          }

          return output;
        },
        totalsRow: (data, isPrint = false) => {
          const totals = {
            financialLossDueSum: 0,
            travelDueSum: 0,
            subsistenceDueSum: 0,
            smartcardDueSum: 0,
            totalDueSum: 0,
            totalPaidSum: 0,
          };
          
          data.forEach((row) => {
            Object.keys(totals).forEach((key) => {
              totals[key] += row[key];
            });
          });

          const htmlTemplate = (total) => {
            if (isPrint) return toMoney(total);
            return `<b class="jd-right-align">${toMoney(total)}</b>`;
          };

          return [
            { text: '', fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.financialLossDueSum), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.travelDueSum), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.subsistenceDueSum), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.smartcardDueSum), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.totalDueSum), bold: true, fillColor: '#F3F2F1' },
            { text: htmlTemplate(totals.totalPaidSum), bold: true, fillColor: '#F3F2F1' },
          ]
        }
      },
      'payment-status-report': {
        title: 'Payment status report ',
        apiKey: 'PaymentStatusReport',
        headings: [
          'reportDate',
          '',
          'reportTime',
          '',
          'courtName',
        ],
        grouped: {
          groupHeader: true,
          totals: true,
          sortGroups: 'ascending',
        },
      },
      'unpaid-attendance': {
        title: 'Unpaid attendance report (summary)',
        apiKey: 'UnpaidAttendanceSummaryReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
          'totalUnpaidAttendances',
          'courtName',
        ],
        grouped: {
          headings: {
            transformer: (data) => dateFilter(data, 'YYYY-mm-dd', 'dddd D MMMM YYYY'),
          },
          groupHeader: true,
          totals: true,
        }
      },
      'deferred-list-date': {
        title: 'Deferred list (by date)',
        apiKey: 'DeferredListByDateReport',
        headings: [
          'totalDeferred',
          'reportDate',
          '',
          'reportTime',
        ],
        backUrl: app.namedRoutes.build('reports.deferred-list.filter.get')
      },
      'deferred-list-court': {
        title: 'Deferred list (by court name)',
        apiKey: 'DeferredListByCourtReport',
        headings: [
          'totalDeferred',
          'reportDate',
          '',
          'reportTime',
        ],
        grouped: {
          groupHeader: true,
          totals: true,
        },
        backUrl: app.namedRoutes.build('reports.deferred-list.filter.get'),
      },
    };
  };
})();
