
(() => {
  'use strict';

  const { incompleteService } = require('../../../objects/reports');
  const { isCourtUser } = require('../../../components/auth/user-type');

  // type IReportKey = {[key:string]: {
  //   title: string,
  //   apiKey: string,
  //   search?: 'poolNumber' | 'dateRange', // etc only poolNumber is currently implemented
  //   bespokeReport?: {
  //     dao?: DAO,                         // custom data access object
  //     insertColumns?: {[key: number]: [string, (data) => string]}, // column header, body
  //   }
  //   headings: string[], // corresponds to the ids provided for the headings in the API
  //                       // (except report created dateTime)
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
        bespokeReport: {
          dao: (request) => incompleteService.get(request, {
            location: request.session.authentication.locCode,
            date: request.params.filter,
          }),
          insertColumns: {
            5: ['', (data) => {
              return { html: `<a href=${
                app.namedRoutes.build('juror.update.complete-service.get', {jurorNumber: data.jurorNumber})
              }>Complete service</a>`};
            }],
          },
        },
        search: 'date',
        searchTitle: 'Cut-off date',
        searchHint: 'Report will show uncompleted jurors with next attendance dates before the cut-off date',
        headings: [
          'cutOffDate',
          'reportDate',
          'totalIncompleteService',
          'reportTime',
          '',
          'courtName',
        ],
      },
    };
  };
})();
