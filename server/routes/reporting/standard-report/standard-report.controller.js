(() => {
  'use strict';

  const { snakeToCamel } = require('../../../lib/mod-utils');
  const { standardReportDAO } = require('../../../objects/reports');
  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const rp = require('request-promise');
  const { reportKeys, tableDataMappers, headingDataMappers } = require('./utils');
  const { standardReportPrint } = require('./standard-report-print');

  const standardFilterGet = (app, reportKey) => async(req, res) => {
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

  const standardReportGet = (app, reportKey, isPrint = false) => async(req, res) => {
    const reportType = reportKeys[reportKey];
    const config = {};
    const filter = req.session.reportFilter;

    delete req.session.reportFilter;

    if (reportType.search && reportType.search === 'poolNumber') {
      config.poolNumber = req.params.filter;
    }

    try {
      const { headings, tableData } = await standardReportDAO.post(app, req, reportType.apiKey, config);

      if (isPrint) return standardReportPrint(app, req, res, reportKey, { headings, tableData });

      const tableHeaders = tableData.headings.map((data, index) => ({
        text: data.name,
        attributes: {
          'aria-sort': index === 0 ? 'ascending' : 'none',
          'aria-label': data.name,
        }}));

      const tableRows = tableData.data.map(data => tableData.headings.map(header => {
        let output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

        if (header.id === 'juror_number') {
          return ({
            html: `<a href=${
              app.namedRoutes.build('juror-record.overview.get', {jurorNumber: output})
            }>${
              output
            }</a>`,
          });
        }

        if (header.id === 'postcode') {
          output = output.toUpperCase();
        }

        return ({
          text: output,
        });
      }));

      const pageHeadings = reportType.headings.map(heading => {
        if (heading === 'reportDate') {
          return { title: 'Report created', data: headingDataMappers.LocalDate(headings.reportCreated.value) };
        } else if (heading === 'reportTime') {
          return { title: 'Time created', data: headingDataMappers.timeFromISO(headings.reportCreated.value) };
        }
        const headingData = headings[heading];

        return { title: headingData.displayName, data: headingDataMappers[headingData.dataType](headingData.value)};
      });

      return res.render('reporting/standard-reports/standard-report', {
        title: reportType.title,
        tableRows,
        tableHeaders,
        pageHeadings,
        reportKey,
        filter: req.params.filter,
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
