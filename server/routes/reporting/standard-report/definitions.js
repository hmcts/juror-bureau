const { dailyUtilisationDAO, dailyUtilisationJurorsDAO } = require('../../../objects/reports');

(() => {
  'use strict';

  const { isCourtUser } = require('../../../components/auth/user-type');

  // type IReportKey = {[key:string]: {
  //   title: string,
  //   apiKey: string,
  //   search?: 'poolNumber' | 'dateRange', // etc only poolNumber is currently implemented
  //   bespokeReport?: {
  //     dao?: (req) => Promise<any>,                                 // custom data access function
  //     insertColumns?: {[key: number]: [string, (data) => string]}, // column header, body
  //     printInsertColumns?: {[key: number]: [string, (data) => string]}, // column header, body (for report pdf printing)
  //     printWidths?: [string], // custom widths for pdf printing tables
  //     body?: boolean, // fully bespoke report body
  //     file?: string, // bespoke nunjucks file route to handle body
  //   }
  //   headings: string[], // corresponds to the ids provided for the headings in the API
  //                       // (except report created dateTime)
  //   headings: string[], // corresponds to the ids provided for the headings in the API
  //                       // (except report created dateTime)
  //   unsortable: boolean, // prevents report table from being sorted
  //   exportLabel: string, // label for export button if required
  //   printLandscape: boolean, // force report printing to landscape
  //   grouped?: TODO,
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
            prefix: 'Pool ',
            link: 'pool-overview',
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
            6: ['', (data) => {
              return { html: `<a href=${
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
          headings: {
            prefix: '',
          },
          groupHeader: !courtUser,
          totals: !courtUser,
        },
        printLandscape: true,
      },
      'persons-attending-summary': {
        title: 'Persons attending (summary)',
        apiKey: 'PersonAttendingSummaryReport',
        search: 'date',
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
            prefix: 'Pool ',
            link: 'pool-overview',
          },
          totals: true,
        },
        bespokeReport: {
          insertColumns: {
            5: ['', (data) => {
              return { text: `*${data.jurorNumber}*`, classes: 'mod-barcode' };
            }],
          },
          printInsertColumns: {
            5: ['', (data) => {
              return { text: `*${data.jurorNumber}*`, style: 'barcode' };
            }],
          },
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
          dao: async(req) => await dailyUtilisationDAO.get(
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
          dao: async(req) => await dailyUtilisationJurorsDAO.get(
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
      'voir-dire': {
        title: 'Panel result report (by trial)',
        apiKey: 'PanelResultReportReport',
        search: 'dateRange',
        headings: [
          'dateFrom',
          'reportDate',
          'dateTo',
          'reportTime',
        ],
      },
    };
  };
})();
