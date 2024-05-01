(() => {
  'use strict';

  const _ = require('lodash');
  const { snakeToCamel, transformCourtNames, makeManualError, matchUserCourt, matchUserCourts } = require('../../../lib/mod-utils');
  const { standardReportDAO } = require('../../../objects/reports');
  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const rp = require('request-promise');
  const { tableDataMappers, constructPageHeading } = require('./utils');
  const { reportKeys } = require('./definitions');
  const { standardReportPrint } = require('./standard-report-print');
  const { fetchCourtsDAO } = require('../../../objects');
  const searchValidator = require('../../../config/validation/report-search-by');
  const moment = require('moment')
  const { dateFilter } = require('../../../components/filters');

  const standardFilterGet = (app, reportKey) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];

    delete req.session.reportCourts;

    if (reportType.search) {
      const { filter } = req.query;
      const tmpErrors = _.clone(req.session.errors);

      switch (reportType.search) {
      case 'poolNumber':
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
      case 'courts':
        
        delete req.session.errors;
        try {
          const courtsData = await fetchCourtsDAO.get(req);
          let courts = transformCourtNames(courtsData.courts);
          if (filter) {
            courts = courts.filter((court) =>{
              const courtName = court.toLowerCase();
      
              return courtName.includes(filter.toLowerCase());
            });
          }
          req.session.courtsList = courtsData.courts;
          return res.render('reporting/standard-reports/court-select', {
            reportKey,
            courts,
            title: reportType.title,
            filter,
            filterUrl: app.namedRoutes.build(`reports.${reportKey}.filter.post`),
            clearFilterUrl: app.namedRoutes.build(`reports.${reportKey}.filter.get`),
            reportUrl: app.namedRoutes.build(`reports.${reportKey}.report.post`),
            cancelUrl: app.namedRoutes.build('reports.reports.get'),
            errors: {
              title: 'Please check your search',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        } catch (err) {
          app.logger.crit('Failed to fetch courts list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          }); 
          return res.render('_errors/generic');
        }
      case 'dateRange':
        const tmpBody = _.clone(req.session.formFields);

        delete req.session.errors;
        delete req.session.formFields;

        return res.render('reporting/standard-reports/date-search', {
          errors: {
            title: 'Please check your search',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          tmpBody,
          reportKey,
          title: reportType.title,
          reportUrl: app.namedRoutes.build(`reports.${reportKey}.report.post`),
        });
      default:
        app.logger.info('Failed to load a search type for report type ' + reportKey);
        return res.render('_errors/generic');
      }
    }
  };

  const standardFilterPost = (app, reportKey) => (req, res) => {
    let filter;
    switch (reportKeys(app, req)[reportKey].search) {
      case 'poolNumber':
        filter = req.body.poolNumber;
        break;
      case 'courts':
        filter = req.body.courtSearch
        break;
    }

    return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`) + '?filter=' + filter);
  };

  const standardReportGet = (app, reportKey, isPrint = false) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];
    const config = { reportType: reportType.apiKey, locCode: req.session.authentication.locCode };
    const filter = req.session.reportFilter;

    const buildStandardTableRows = function(tableData, tableHeadings) {
      return tableData.map(data => {
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

          if (header.id === 'juror_postcode' || header.id === 'document_code') {
            output = output.toUpperCase();
          }

          if (header.id === 'contact_details') {
            const details = output.split(', ');
            let html = '';
  
            details.forEach((element) => {
              html = html
                + `${
                  element
                }<br>`;
            });
            return ({
              html: `${html}`,
            });
          }

          return ({
            text: output ? output : '-',
            attributes: {
              "data-sort-value": header.dataType === 'LocalDate' ? data[snakeToCamel(header.id)] : output
          }
          });
        });

        if (reportType.bespokeReport && reportType.bespokeReport.insertColumns) {
          Object.keys(reportType.bespokeReport.insertColumns).map((key) => {
            row.splice(key, 0, reportType.bespokeReport.insertColumns[key][1](data));
          });
        }

        return row;
      });
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

    const buildBackLinkUrl = function() {
      if (reportType.searchUrl) {
        return reportType.searchUrl;
      }
      if (reportType.search === 'trial') {
        return app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.filter, locationCode: req.session.authentication.locCode
        });
      }
      return app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (filter ? '?filter=' + filter : '');
    };

    delete req.session.reportFilter;

    if (reportType.search) {
      if (reportType.search === 'poolNumber') {
        config.poolNumber = req.params.filter;
      } else if (reportType.search === 'date') {
        config.date = req.params.filter;
      } else if (reportType.search === 'trial') {
        config.trialNumber = req.params.filter;
        config.locCode = req.session.authentication.locCode;
      } else if (reportType.search === 'courts') {
        // VERIFY FIELD NAME ONCE AN API AVAILABLE
        config.courts = _.clone(req.session.reportCourts)
      }
    }

    if (req.query.fromDate) {
      config.fromDate = req.query.fromDate;
      config.toDate = req.query.toDate;
    }

    try {
      const { headings, tableData } = await (reportType.bespokeReport?.dao
        ? reportType.bespokeReport.dao(req)
        : standardReportDAO.post(req, app, config));

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
          url: buildBackLinkUrl(),
        },
      });
    } catch (e) {
      console.error(e);
    }

    return res.render('_errors/generic');
  };

  const standardReportPost = (app, reportKey) => async (req, res) => {
    const reportType = reportKeys(app, req)[reportKey];
    if (reportType.search === 'poolNumber') {
      if (!req.body.reportPool) {
        req.session.errors = {
          selection: [{
            fields: ['selection'],
            summary: 'Select a pool',
            details: ['Select a pool'],
          }],
        };

        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`)
          + (req.body.filter ? '?filter=' + req.body.filter : ''));
      }

      req.session.reportFilter = req.body.filter;

      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {
        filter: req.body.reportPool,
      }));
    }
    if (reportType.search === 'courts') {
      if (!req.body.selectedCourts) {
        req.session.errors = makeManualError('selectedCourts', 'Select at least one court');

        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`)
          + (req.body.filter ? '?filter=' + req.body.filter : ''));
      }
      req.session.reportFilter = req.body.filter;
      const selectedCourts = Array.isArray(req.body.selectedCourts) ? req.body.selectedCourts : [req.body.selectedCourts]
      const courtLocCodes = selectedCourts.map((court) => {
        return court.match(/\d+/g)[0];
      });
      delete req.session.courtsList
      req.session.reportCourts = courtLocCodes;
      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, { filter: 'courts' }));
    }
    if (reportType.search === 'dateRange') {
      const validatorResult = validate(req.body, searchValidator.dateRange(_.camelCase(reportKey)));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }
      const fromDate = moment(req.body.dateFrom, 'DD/MM/YYYY');
      const toDate = moment(req.body.dateTo, 'DD/MM/YYYY');

      if (toDate.isBefore(fromDate)) {
        req.session.errors = {
          dateTo: [{
            summary: '‘Date to’ cannot be before ‘date from’',
            details: '‘Date to’ cannot be before ‘date from’',
          }],
        };
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }

      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, {filter: 'dateRange'})
        + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
        + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`);
    } 
  };

  module.exports = {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  };
})();
