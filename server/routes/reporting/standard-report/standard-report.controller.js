(() => {
  'use strict';

  const _ = require('lodash');
  const { snakeToCamel } = require('../../../lib/mod-utils');
  const { standardReportDAO } = require('../../../objects/reports');
  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const rp = require('request-promise');
  const { reportKeys, tableDataMappers, constructPageHeading } = require('./utils');
  const { standardReportPrint } = require('./standard-report-print');

  const standardFilterGet = (app, reportKey) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];

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
          filterUrl: app.namedRoutes.build(`reports.${reportKey}.filter.post`),
          reportUrl: app.namedRoutes.build(`reports.${reportKey}.report.post`),
        });
      default:
        app.logger.info('Failed to load a search type for report type ' + reportKey);
        return res.render('_errors/generic');
      }
    }
  };

  const standardFilterPost = (app, reportKey) => (req, res) => {
    const filter = req.body.poolNumber;

    return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`) + '?filter=' + filter);
  };

  const standardReportGet = (app, reportKey, isPrint = false) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];
    const config = {};
    const filter = req.session.reportFilter;

    const buildStandardTableRows = function(tableData, tableHeadings) {
      const tableRows = tableData.map(data => {
        let row = tableHeadings.map(header => {
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

          if (header.id === 'juror_postcode') {
            output = output.toUpperCase();
          }

          if (reportType.bespokeReport && reportType.bespokeReport.insertColumns) {
            Object.keys(reportType.bespokeReport.insertColumns).map((key) => {
              row.splice(key, 0, reportType.bespokeReport.insertColumns[key][1](data, app));
            });
          }

          return ({
            text: output ? output : '-',
          });
        });
      });

      return tableRows;
    };

    const buildPrintUrl = function() {
      let printUrl = req.params.filter
        ? app.namedRoutes.build(`reports.${reportKey}.report.print`, {filter: req.params.filter})
        : app.namedRoutes.build(`reports.${reportKey}.report.print`);

      if (req.query.fromDate) {
        printUrl = printUrl + '?fromDate=' + req.query.fromDate + '&toDate=' + req.query.toDate;
      }
      return printUrl;
    };

    delete req.session.reportFilter;

    if (reportType.search && reportType.search === 'poolNumber') {
      config.poolNumber = req.params.filter;
    }

    if (req.query.fromDate) {
      config.fromDate = req.query.fromDate;
      config.toDate = req.query.toDate;
    }

    try {
      const { headings, tableData } = await standardReportDAO.post(app, req, reportType.apiKey, config);

      if (isPrint) return standardReportPrint(app, req, res, reportKey, { headings, tableData });

      let tableHeaders = tableData.headings.map((data, index) => ({
        text: data.name,
        attributes: {
          'aria-sort': index === 0 ? 'ascending' : 'none',
          'aria-label': data.name,
        }}));

      if (reportType.bespokeReport && reportType.bespokeReport.insertColumns) {
        Object.keys(reportType.bespokeReport.insertColumns).map((key) => {
          tableHeaders.splice(key, 0, {text: reportType.bespokeReport.insertColumns[key][0]});
        });
      }

      let tableRows = [];

      // GROUPED REPORT
      if (reportType.grouped)  {
        for (const [header, data] of Object.entries(tableData.data)) {
          const group = buildStandardTableRows(data, tableData.headings);
          let link;

          if (reportType.grouped.headings && reportType.grouped.headings.link) {
            if (reportType.grouped.headings.link === 'pool-overview') {
              link = app.namedRoutes.build('pool-overview.get', {poolNumber: header});
            }
          }

          const headRow = link
            ? [{
              html: `<a href=${link}>${(reportType.grouped.headings.prefix || '') + header}</a>`,
              colspan: tableData.headings.length,
              classes: 'govuk-!-padding-top-7 govuk-link govuk-body-l govuk-!-font-weight-bold',
            }]
            : [{
              text: (reportType.grouped.headings.prefix || '') + header,
              colspan: tableData.headings.length,
              classes: 'govuk-!-padding-top-7 govuk-body-l govuk-!-font-weight-bold',
            }];
          const totalsRow = reportType.grouped.totals ? [{
            text: `Total: ${group.length}`,
            colspan: tableData.headings.length,
            classes: 'govuk-body-s govuk-!-font-weight-bold mod-table-no-border',
          }] : null;

          tableRows = tableRows.concat([
            headRow,
            ...group,
            totalsRow,
          ]);
        }
      } else {
        tableRows = buildStandardTableRows(tableData.data, tableData.headings);
      }

      const pageHeadings = reportType.headings.map(heading => constructPageHeading(heading, headings));

      return res.render('reporting/standard-reports/standard-report', {
        title: reportType.title,
        tableRows,
        tableHeaders,
        pageHeadings,
        reportKey,
        grouped: reportType.grouped,
        filter: req.params.filter,
        printUrl: buildPrintUrl(),
        backLinkUrl: {
          built: true,
          url: reportType.search === 'poolNumber'
            ? app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (filter ? '?filter=' + filter : '')
            : reportType.searchUrl,
        },
      });
    } catch (e) {
      console.error(e);
    }

    return res.render('_errors/generic');
  };

  const standardReportPost = (app, reportKey) => (req, res) => {
    if (reportKeys(app, req)[reportKey].search === 'poolNumber' && !req.body.reportPool) {
      req.session.errors = {
        selection: [{
          fields: ['selection'],
          summary: 'Select a pool',
          details: ['Select a pool'],
        }],
      };

      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`) + '?filter=' + req.body.filter);
    }

    req.session.reportFilter = req.body.filter;

    return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {
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
