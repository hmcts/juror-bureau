const { snakeToCamel } = require('../../../lib/mod-utils');

(() => {
  'use strict';

  const { dateFilter, capitalizeFully } = require('../../../components/filters');
  const { standardReportDAO } = require('../../../objects/reports');
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

  const dataMappers = {
    String: (data) => capitalizeFully(data),
    LocalDate: (data) => dateFilter(data, 'YYYY-mm-dd', 'ddd D MMM YYYY'),
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

  const standardReportGet = (app, reportKey) => async (req, res) => {
    const reportType = reportKeys[reportKey];
    const config = {};
    const filter = req.session.reportFilter;

    delete req.session.reportFilter;

    if (reportType.search && reportType.search === 'poolNumber') {
      config.poolNumber = req.params.filter;
    }

    try {
      const { headings, tableData } = await standardReportDAO.post(app, req, reportType.apiKey, config);

      const tableHeaders = tableData.headings.map((data, index) => ({
        text: data.name,
        attributes: {
          'aria-sort': index === 0 ? 'ascending' : 'none',
        }}));

      const tableRows = tableData.data.map(data => tableData.headings.map(header => {
        let output = dataMappers[header.dataType](data[snakeToCamel(header.id)]);

        if (header.id === 'postcode') {
          output = output.toUpperCase();
        }

        return ({
          text: output,
        });
      }));

      console.log(tableData.headings)
      return res.render('reporting/standard-reports/standard-report', {
        title: reportType.title,
        tableRows,
        tableHeaders,
        headings,
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build(`${reportKey}.filter.get`) + (filter ? '?filter=' + filter : ''),
        },
      });
    } catch (e) {
      console.error(e);
    }

    return res.render('_errors/generic');
  };

  const standardReportPost = (app, reportKey) => (req, res) => {
    if (reportKeys[reportKey].search === 'poolNumber' && !req.body.reportPool) {
      req.session.errors = {
        selection: [{
          fields: ['selection'],
          summary: 'Select a pool',
          details: ['Select a pool'],
        }],
      };

      return res.redirect(app.namedRoutes.build(`${reportKey}.filter.get`) + '?filter=' + req.body.filter);
    }

    req.session.reportFilter = req.body.filter;

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
