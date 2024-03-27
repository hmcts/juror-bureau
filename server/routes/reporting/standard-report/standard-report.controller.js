(() => {
  'use strict';

  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const rp = require('request-promise');

  // type IReportKey = {[key:string]: {
  //   title: string,
  //   apiKey: string,
  //   search?: 'poolNumber' | 'dateRange' // etc
  // }};
  const reportKeys = {
    'next-due': {
      title: 'Next attendance date report',
      apiKey: 'NextAttendanceDayReport',
      search: 'poolNumber',
    },
  };

  const standardFilterGet = (app, reportKey) => async (req, res) => {
    const reportType = reportKeys[reportKey];

    if (reportType.search) {
      switch (reportType.search) {
      case 'poolNumber':
        const filter = req.query.filter;
        let poolList = [];
        let resultsCount = 0;
        let errors;
        const submitErrors = req.session.errors || {};

        delete req.session.errors;

        if (filter) {
          errors = {...validate({poolNumber: filter}, {poolNumber: {poolNumberSearched: {}}})};

          if (Object.keys(errors).length === 0) {
            const api = await poolSearchObject.post(rp, app, req.session.authToken, {poolNumber: filter});

            poolList = api.poolRequests;
            resultsCount = api.resultsCount;
          }
        }

        errors = {...errors, ...submitErrors};

        return res.render('reporting/standard-reports/pool-search', {
          errors: {
            title: 'Please check your search',
            count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
            items: errors,
          },
          reportKey,
          title: reportType.title,
          resultsCount,
          poolList,
          filter,
          filterUrl: app.namedRoutes.build(`${reportKey}.filter.post`),
          reportUrl: app.namedRoutes.build(`${reportKey}.report.post`),
        });
      default:
        app.logger.info('Failed to load a search type for report type ' + reportKey);
        return res.render('_errors/generic');
      }
    }
  };

  const standardFilterPost = (app, reportKey) => (req, res) => {
    const filter = req.body.poolNumber;

    return res.redirect(app.namedRoutes.build(`${reportKey}.filter.get`) + '?filter=' + filter);
  };

  const standardReportGet = (app, reportKey) => (req, res) => {
    console.log('report!');

    return res.render('_errors/generic');
  };

  const standardReportPost = (app, reportKey) => (req, res) => {
    console.log(req.body);
    if (reportKeys[reportKey].search === 'poolNumber' && !req.body.reportPool) {
      req.session.errors = {
        selection: [{
          fields: ['selection'],
          summary: 'Select a pool to view a report',
          details: ['Select a pool to view a report'],
        }],
      };

      return res.redirect(app.namedRoutes.build(`${reportKey}.filter.get`) + '?filter=' + req.body.filter);
    }

    return res.redirect(app.namedRoutes.build(`${reportKey}.report.get`, {
      filter: req.body.reportPool,
    }));
  };

  module.exports = {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  };
})();
