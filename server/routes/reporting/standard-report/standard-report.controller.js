(() => {
  'use strict';

  const _ = require('lodash');
  const { snakeToCamel, transformCourtNames, makeManualError } = require('../../../lib/mod-utils');
  const { standardReportDAO } = require('../../../objects/reports');
  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const rp = require('request-promise');
  const { tableDataMappers, constructPageHeading, buildTableHeaders } = require('./utils');
  const { bespokeReportBodys } = require('../bespoke-report/bespoke-report-body');
  const { reportKeys } = require('./definitions');
  const { standardReportPrint } = require('./standard-report-print');
  const { fetchCourtsDAO } = require('../../../objects');
  const searchValidator = require('../../../config/validation/report-search-by');
  const moment = require('moment')
  const { dateFilter, capitalizeFully } = require('../../../components/filters');
  const { reportExport } = require('./report-export');

  const standardFilterGet = (app, reportKey) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];

    delete req.session.reportCourts;

    if (reportType.search) {
      const { filter } = req.query;
      const tmpBody = _.clone(req.session.formFields);
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

        if (res.locals.isCourtUser) {
          poolList = poolList.filter((pool) => pool.poolStage === 'At court');
        }

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
      case 'fixedDateRange':
      case 'dateRange':
        const isFixedDateRange = reportType.search === 'fixedDateRange';
        delete req.session.errors;
        delete req.session.formFields;

        return res.render('reporting/standard-reports/date-search', {
          errors: {
            title: 'Please check your search',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          isFixedDateRange,
          tmpBody,
          reportKey,
          title: reportType.title,
          reportUrl: app.namedRoutes.build(`reports.${reportKey}.report.post`),
          cancelUrl: app.namedRoutes.build('reports.reports.get'),
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

  const standardReportGet = (app, reportKey, isPrint = false, isExport = false) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];
    const config = { reportType: reportType.apiKey, locCode: req.session.authentication.locCode };
    const filter = req.session.reportFilter;
    const bannerMessage = _.clone(req.session.bannerMessage);
    let preReportRoute = _.clone(req.session.preReportRoute)

    delete req.session.preReportRoute

    delete req.session.bannerMessage;
    req.session.reportSearch = req.params.filter;

    const buildStandardTableRows = function(tableData, tableHeadings) {
      return tableData.map(data => {

        let row = tableHeadings.map(header => {
          let output = tableDataMappers[header.dataType](data[snakeToCamel(header.id)]);

          if (header.id === 'juror_number' || header.id === 'juror_number_from_trial') {
            return ({
              html: `<a href=${
                app.namedRoutes.build('juror-record.overview.get', {jurorNumber: output})
              }>${
                output
              }</a>`,
            });
          }

          if (header.id === 'pool_number' || header.id === 'pool_number_by_jp' || header.id === 'appearance_pool_number') {
            return ({
              html: `<a href=${
                app.namedRoutes.build('pool-overview.get', {poolNumber: output})
              }>${
                output
              }</a>`,
            });
          }

          if (header.id === 'juror_postcode' || header.id === 'document_code') {
            output = output ? output.toUpperCase() : '-';
          }

          if (header.dataType === 'List') {
            const items = output.split(', ');
            let html = '';
  
            items.forEach((element, i, array) => {
              html = html + `${element}${header.id === 'juror_postal_address' ? (!(i === array.length - 1) ? ',' : '') : ''}<br>`;
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

    const buildPrintExportUrl = function(urlType = 'print') {
      let url = req.params.filter
        ? app.namedRoutes.build(`reports.${reportKey}.report.${urlType}`, {filter: req.params.filter})
        : app.namedRoutes.build(`reports.${reportKey}.report.${urlType}`);

      if (req.query.fromDate) {
        url = url + '?fromDate=' + req.query.fromDate + '&toDate=' + req.query.toDate;
      }

      if (req.query.includeSummoned) {
        url = url + '?includeSummoned=' + req.query.includeSummoned;
      }

      if (req.query.previousMonths) {
        url = url + '?previousMonths=true'
      }

      return url;
    };

    const buildBackLinkUrl = function() {
      if (preReportRoute) {
        return preReportRoute;
      }
      if (reportType.backUrl) {
        return reportType.backUrl;
      }
      if (reportType.search === 'trial') {
        return app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.filter, locationCode: req.session.authentication.locCode
        });
      }
      if (reportKey === 'daily-utilisation-jurors') {
        return req.session.dailyUtilisation.route
      }
      return app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (filter ? '?filter=' + filter : '');
    };

    delete req.session.reportFilter;

    if (reportType.search) {
      if (reportType.search === 'poolNumber') {
        config.poolNumber = req.params.filter;
      } else if (reportType.search === 'date' || moment(req.params.filter, 'yyyy-MM-DD', true).isValid()) {
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

    if (reportKey.includes('persons-attending')) {
      config.includeSummoned = req.query.includeSummoned || false;
    }

    // Backlink routing needs saved for jurors report
    if (reportKey === 'daily-utilisation') {
      req.session.dailyUtilisation = {
        route: app.namedRoutes.build('reports.daily-utilisation.report.get', {
          filter:'dateRange' 
        }) + `?fromDate=${req.query.fromDate}&toDate=${req.query.toDate}`
      }
    }

    try {
      const { headings, tableData } = await (reportType.bespokeReport?.dao
        ? reportType.bespokeReport.dao(req)
        : standardReportDAO.post(req, app, config));

      if (isPrint) return standardReportPrint(app, req, res, reportKey, { headings, tableData });
      if (isExport) return reportExport(app, req, res, reportKey, { headings, tableData }) 


      let tables = [];

      if (reportType.bespokeReport && reportType.bespokeReport.body) {
        tables = bespokeReportBodys(app)[reportKey](reportType, tableData)
      } else {
        let tableRows = [];
        const tableHeaders = buildTableHeaders(reportType, tableData);

        if (reportType.grouped) {
          for (const [header, data] of Object.entries(tableData.data)) {
            const group = buildStandardTableRows(data, tableData.headings);
            let link;

            if (reportType.grouped.headings && reportType.grouped.headings.link) {
              if (reportType.grouped.headings.link === 'pool-overview') {
                link = app.namedRoutes.build('pool-overview.get', {poolNumber: header});
              }
            }

            const groupHeaderTransformer = () => {
              if (reportType.grouped.headings && reportType.grouped.headings.transformer) {
                return reportType.grouped.headings.transformer(header);
              }
              return header;
            }

            const headRow = (() => {
              if (!reportType.grouped.groupHeader) return [];

              return link ? [{
                html: `<a href=${link}>${(reportType.grouped.headings.prefix || '') + groupHeaderTransformer()}</a>`,
                colspan: group[0].length,
                classes: 'govuk-!-padding-top-7 govuk-link govuk-body-l govuk-!-font-weight-bold',
              }]
              : [{
                html: capitalizeFully((reportType.grouped.headings.prefix || '') + groupHeaderTransformer()),
                colspan: group[0].length,
                classes: 'govuk-!-padding-top-7 govuk-body-l govuk-!-font-weight-bold',
              }];
            })();
              
            const totalsRow = reportType.grouped.totals ? [{
              text: `Total: ${group.length}`,
              colspan: group[0].length,
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
        console.log(tableRows)
        tables = tableRows.length ? [{headers: tableHeaders, rows: tableRows}] : []
      }

      const pageHeadings = reportType.headings.map(heading => constructPageHeading(heading, headings));

      return res.render('reporting/standard-reports/standard-report', {
        title: reportType.title,
        tables,
        pageHeadings,
        reportKey,
        grouped: reportType.grouped,
        bespokeReportFile: reportType.bespokeReport?.file,
        unsortable: reportType.unsortable,
        exportLabel: reportType.exportLabel,
        exportUrl: reportType.exportLabel ? buildPrintExportUrl('export') : '',
        searchType:  reportType.search,
        filter: req.params.filter,
        printUrl: buildPrintExportUrl('print'),
        backLinkUrl: {
          built: true,
          url: buildBackLinkUrl(),
        },
        bannerMessage,
        largeTotals: reportType.largeTotals ? reportType.largeTotals(tableData.data) : [],
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
    if (reportType.search === 'dateRange' || reportType.search === 'fixedDateRange') {
      if (req.body.dateRange && req.body.dateRange === 'NEXT_31_DAYS') {
        req.body.dateFrom = moment().format('DD/MM/YYYY');
        req.body.dateTo = moment().add(31, 'days').format('DD/MM/YYYY');
      }

      const validatorResult = validate(req.body, searchValidator.dateRange(_.camelCase(reportKey), req.body));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }
      const fromDate = moment(req.body.dateFrom, 'DD/MM/YYYY');
      const toDate = moment(req.body.dateTo, 'DD/MM/YYYY');
      let redirectRoute = `reports.${reportKey}.report.get`

      if (toDate.isBefore(fromDate)) {
        req.session.errors = makeManualError('dateTo', '‘Date to’ cannot be before ‘date from’');
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }

      if (reportKey === 'daily-utilisation') { 
        if((toDate.diff(fromDate, 'days') + 1) > 31) {
          req.session.errors = makeManualError('dateTo', 'Date range cannot be larger than 31 days');
          req.session.formFields = req.body;
          return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
        }
        redirectRoute = `reports.daily-utilisation.check.get`
      }

      return res.redirect(app.namedRoutes.build(redirectRoute, {filter: 'dateRange'})
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
