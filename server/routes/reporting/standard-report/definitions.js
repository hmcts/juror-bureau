
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
  //   }
  //   headings: string[], // corresponds to the ids provided for the headings in the API
  //                       // (except report created dateTime)
  //   grouped?: TODO,
  //   printLandscape?: boolean,
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
        searchUrl: app.namedRoutes.build('reports.postponed.search.get'),
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
          totals: true,
        },
        searchUrl: app.namedRoutes.build('reports.postponed.search.get'),
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
        bespokeReportBody: true,
        exportable: true,
      },
      'reasonable-adjustments': {
        title: 'Reasonable adjustments report',
        apiKey: 'ReasonableAdjustmentsReport',
        search: 'dateRange',
        headings: [
          'totalReasonableAdjustments',
          'reportDate',
          '',
          'reportTime',
        ],
        grouped: {
          headings: {
            prefix: '',
          },
          totals: true,
        },
        printLandscape: true,
      },
    };
  };
})();
