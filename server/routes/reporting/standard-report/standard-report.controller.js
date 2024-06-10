(() => {
  'use strict';

  const _ = require('lodash');
  const { snakeToCamel, transformCourtNames, makeManualError, checkIfArrayEmpty, transformRadioSelectTrialsList, replaceAllObjKeys, camelToSnake, mapCamelToSnake } = require('../../../lib/mod-utils');
  const { standardReportDAO } = require('../../../objects/reports');
  const { validate } = require('validate.js');
  const { poolSearchObject } = require('../../../objects/pool-search');
  const { searchJurorRecordDAO } = require('../../../objects');
  const rp = require('request-promise');
  const { tableDataMappers, constructPageHeading, buildTableHeaders } = require('./utils');
  const { bespokeReportBodys } = require('../bespoke-report/bespoke-report-body');
  const { reportKeys } = require('./definitions');
  const { standardReportPrint } = require('./standard-report-print');
  const { fetchCourtsDAO, trialsListDAO } = require('../../../objects');
  const searchValidator = require('../../../config/validation/report-search-by');
  const jurorSearchValidator = require('../../../config/validation/juror-search');
  const moment = require('moment')
  const { dateFilter, capitalizeFully, capitalise } = require('../../../components/filters');
  const { reportExport } = require('./report-export');

  const standardFilterGet = (app, reportKey) => async(req, res) => {
    const reportType = reportKeys(app, req)[reportKey];
    let customSearchLabel;

    delete req.session.reportCourts;

    if(reportType.apiKey === 'PanelResultReport') {
      customSearchLabel = 'Search trials between these dates';
    }

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
            const api = await poolSearchObject.post(rp, app, req.session.authToken, { poolNumber: filter });

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
          filterUrl: addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.post`)),
          reportUrl: addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.report.post`)),
          backLinkUrl: {
            built: true,
            url: reportType.filterBackLinkUrl,
          },
        });
      case 'jurorNumber':
        let jurorList = [];
        let _resultsCount = 0;
        let _errors;
        const submitError = req.session.errors || {};

        delete req.session.errors;

        const payload = {
          page_limit: 500,
          sort_method: 'DESC',
          sort_field: 'JUROR_NUMBER',
          page_number: 1,
          juror_number: filter
        }

        if (filter) {
          _errors = validate({ jurorNumber: filter }, jurorSearchValidator.jurorNumberSearched());
        }

        if (typeof _errors === 'undefined') {
          const data = await searchJurorRecordDAO.post(req, payload);
          
          jurorList = data.data;
          _resultsCount = data.total_items;
        }

        _errors = { ..._errors, ...submitError };

        return res.render('reporting/standard-reports/juror-search', {
          errors: {
            title: 'Please check your search',
            count: typeof _errors !== 'undefined' ? Object.keys(_errors).length : 0,
            items: _errors,
          },
          reportKey,
          title: reportType.title,
          resultsCount: _resultsCount,
          jurorList,
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
            filterUrl:  addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.post`)),
            clearFilterUrl:  addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.get`)),
            reportUrl: addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.report.post`)),
            cancelUrl: app.namedRoutes.build('reports.reports.get'),
            backLinkUrl: {
              built: true,
              url: reportType.filterBackLinkUrl,
            },
            errors: {
              title: 'Please check your search',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        } catch (err) {
          console.log(err);

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
          fixedDateRangeValues: reportType.fixedDateRangeValues || [],
          tmpBody,
          reportKey,
          customSearchLabel,
          title: reportType.title,
          searchLabels: reportType.searchLabelMappers,
          reportUrl: addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.report.post`)),
          exportOnly: reportType.exportOnly,
          cancelUrl: app.namedRoutes.build('reports.reports.get'),
          backLinkUrl: {
            built: true,
            url: reportType.filterBackLinkUrl,
          },
        });
      case 'trial':
        const sortBy = req.query['sortBy'] || 'trialNumber';
        const sortOrder = req.query['sortOrder'] || 'ascending';
        const opts = {
          active: true,
          pageNumber: 1,
          pageLimit: 500,
          sortField: capitalise(camelToSnake(sortBy)),
          sortMethod: sortOrder === 'ascending' ? 'ASC' : 'DESC',
        };
        if (filter) {
          opts.trialNumber = filter
        }
        try{
          let data = await trialsListDAO.post(req, mapCamelToSnake(opts));

          data = replaceAllObjKeys(data, _.camelCase);
  
          return res.render('reporting/standard-reports/trial-select', {
            errors: {
              title: 'Please check your search',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
            tmpBody,
            reportKey,
            filter,
            title: reportType.title,
            filterUrl: app.namedRoutes.build(`reports.${reportKey}.filter.post`),
            clearSearchUrl: app.namedRoutes.build(`reports.${reportKey}.filter.get`),
            reportUrl: app.namedRoutes.build(`reports.${reportKey}.report.post`),
            cancelUrl: app.namedRoutes.build('reports.reports.get'),
            trials: transformRadioSelectTrialsList(data.data, sortBy, sortOrder),
            backLinkUrl: {
              built: true,
              url: reportType.filterBackLinkUrl,
            },
          });
        } catch (err) {
          app.logger.crit('Failed to fetch trials list: ', {
            auth: req.session.authentication,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        }
      default:
        app.logger.info('Failed to load a search type for report type ' + reportKey);
        return res.render('_errors/generic');
      }
    }
  };

  const standardFilterPost = (app, reportKey) => (req, res) => {
    const reportType = reportKeys(app, req)[reportKey];

    let filter;
    switch (reportKeys(app, req)[reportKey].search) {
      case 'poolNumber':
        filter = req.body.poolNumber;
        break;
      case 'courts':
        filter = req.body.courtSearch;
        break;
      case 'jurorNumber':
        filter = req.body.jurorNumber;
        break;
      case 'trial':
        filter = req.body.filterTrialNumber;
        break;
    }

    return res.redirect(addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.get`) + '?filter=' + filter));
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
      tableData = Array.isArray(tableData) ? tableData : [tableData];
      const rows = tableData.map(data => {
        let row = tableHeadings.map(header => {
          if (!header.name || header.name === '') return;
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
          
          if (header.id === 'trial_type') {
            return { html: output === 'Civ' ? 'Civil' : 'Criminal' };
          }

          if (header.id.includes('pool_number')) {
            return ({
              html: `<a href=${
                app.namedRoutes.build('pool-overview.get', {poolNumber: output})
              }>${
                output
              }</a>`,
            });
          }

          if (header.id.includes('trial_number') && output) {
            return ({
              html: `<a href=${
                app.namedRoutes.build('trial-management.trials.detail.get', {trialNumber: output, locationCode: req.session.authentication.locCode})
              }>${
                output
              }</a>`,
            });
          }

          if (header.id === 'payment_audit' && output !== '-') {
            return ({
              html: `<a href=${
                app.namedRoutes.build('reports.financial-audit.get', {auditNumber: output})
              }>${
                output
              }</a>`,
            });
          }

          if (header.id === 'attendance_audit' && output !== '-') {
            let link;
            if (output && output.charAt(0) === 'P') {
              link = app.namedRoutes.build('reports.pool-attendance-audit.report.print', {
                filter: output,
              })
            } else if (output && output.charAt(0) === 'J') {
              link = app.namedRoutes.build('reports.jury-attendance-audit.report.print', {
                filter: output,
              })
            }
            return ({
              html: link 
                ? `<a href='${link}' target="_blank">${
                  output
                }</a>`
                : output,
            });
          }

          if (header.id === 'juror_postcode' || header.id === 'document_code') {
            output = output ? output.toUpperCase() : '-';
          }

          if (header.id === 'on_call') {
            output = output === 'Yes' ? 'Yes' : '-';
          }

          if (header.id === 'excusal_disqual_code') {
            output = `${capitalise(output.split('-')[0])} - ${output.split('-')[1]}`;
          }

          if (header.id === 'comments') {
            output = output.replace('\n','<br><br>')
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

          if (reportType.cellTransformer) {
            output = reportType.cellTransformer(data, header.id, output);
          }

          const numericTypes = ['Integer', 'BigDecimal', 'Long', 'Double']

          const sortValue = numericTypes.includes(header.dataType) ? data[snakeToCamel(header.id)] : output;

          return ({
            html: output ? output : '-',
            attributes: {
              "data-sort-value": sortValue && sortValue !== '-' 
                ? (header.dataType === 'LocalDate' ? data[snakeToCamel(header.id)] : sortValue) 
                : (numericTypes.includes(header.dataType) ? '0' : '-')
            },
            format: header.dataType === 'BigDecimal' ? 'numeric' : '',
          });
        });

        if (reportType.bespokeReport && reportType.bespokeReport.insertColumns) {
          Object.keys(reportType.bespokeReport.insertColumns).map((key) => {
            row.splice(key, 0, reportType.bespokeReport.insertColumns[key][1](data));
          });
        }

        return row;
      });
      if (reportType.bespokeReport && reportType.bespokeReport.insertRows) {
        Object.keys(reportType.bespokeReport.insertRows).map((key) => {
          if (key === 'last') {
            rows.push(reportType.bespokeReport.insertRows[key](tableData))
          } else {
            rows.splice(key, 0, reportType.bespokeReport.insertRows[key](tableData));
          }
        });
      }
      return rows;
    };

    const buildStandardTable = function(reportType, tableData, tableHeadings, sectionHeading = '') {
      let tableRows = [];
      const tableHeaders = buildTableHeaders(reportType, tableHeadings);
      const tableFoot = reportType.totalsRow ? reportType.totalsRow(tableData) : null;

      if (reportType.grouped) {
        let longestGroup = 0;

        if (reportType.grouped.sortGroups) {
          let ordered = {};
          if (reportType.grouped.sortGroups === 'descending') {
            (Object.keys(tableData).sort()).reverse().forEach(key => ordered[key] = tableData[key])
          } else {
            Object.keys(tableData).sort().forEach(key => ordered[key] = tableData[key])
          }
          tableData = ordered;
        }
        
        for (const [header, data] of Object.entries(tableData)) {
          let group = buildStandardTableRows(data, tableHeadings);
          let link;

          if (reportType.grouped.headings && reportType.grouped.headings.link) {
            if (reportType.grouped.headings.link === 'pool-overview') {
              link = app.namedRoutes.build('pool-overview.get', {poolNumber: header});
            }
          }

          longestGroup = group[0].length > longestGroup ? group[0].length : longestGroup; 

          const groupHeaderTransformer = () => {
            if (reportType.grouped.headings && reportType.grouped.headings.transformer) {
              return reportType.grouped.headings.transformer(header);
            }
            return capitalizeFully(header);
          }

          const headRow = reportType.grouped.groupHeader ? [{
            html: groupHeaderTransformer(),
            colspan: group[0].length,
            classes: 'govuk-!-padding-top-7 govuk-body-l govuk-!-font-weight-bold',
          }] : []
            
          const totalsRow = reportType.grouped.totals ? [{
            text: `Total: ${group.length}`,
            colspan: longestGroup,
            classes: 'govuk-body-s govuk-!-font-weight-bold mod-table-no-border',
          }] : null;

          if (checkIfArrayEmpty(group)) {
            if (reportType.grouped.emptyDataGroup) {
              group = reportType.grouped.emptyDataGroup(longestGroup);
            } else {
              break;
            }
          }

          tableRows = tableRows.concat([
            headRow,
            ...group,
            totalsRow,
          ]);
        }
      } else {
        tableRows = buildStandardTableRows(tableData, tableHeadings);
      }

      return tableRows.length ? [{
        title: capitalizeFully(sectionHeading),
        headers: tableHeaders,
        rows: tableRows,
        tableFoot,
      }] : [];
    }

    const buildPrintExportUrl = function(urlType = 'print') {
      let url = req.params.filter
        ? app.namedRoutes.build(`reports.${reportKey}.report.${urlType}`, {filter: req.params.filter})
        : app.namedRoutes.build(`reports.${reportKey}.report.${urlType}`);

      if (req.query.fromDate) {
        url = url + '?fromDate=' + req.query.fromDate + '&toDate=' + req.query.toDate;
      }

      return addURLQueryParams(reportType,  url);
    };

    const buildBackLinkUrl = function() {
      if (preReportRoute) {
        return preReportRoute;
      }
      if (reportType.backUrl) {
        return reportType.backUrl;
      }
      if (reportType.search === 'trial') {
        if (reportKey === 'trial-attendance') {
          return app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (filter ? '?filter=' + filter : '')
        }
        return app.namedRoutes.build('trial-management.trials.detail.get', {
          trialNumber: req.params.filter, locationCode: req.session.authentication.locCode
        });
      }
      if (reportKey === 'daily-utilisation-jurors') {
        return req.session.dailyUtilisation.route
      }
      if (Object.keys(app.namedRoutes.routesByNameAndMethod).includes(`reports.${reportKey}.filter.get`)) {
        return addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (filter ? '?filter=' + filter : ''));
      } else {
        return app.namedRoutes.build(`reports.reports.get`)
      }
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
      } else if (reportType.search === 'jurorNumber') {
        // VERIFY FIELD NAME ONCE AN API AVAILABLE 
        config.jurorNumber = req.params.filter;
      }
    } else if (reportType.searchProperty) {
      config[reportType.searchProperty] = req.params.filter;
    }

    if (req.query.fromDate) {
      config.fromDate = req.query.fromDate;
      config.toDate = req.query.toDate;
    }

    if (reportKey.includes('persons-attending')) {
      config.includeSummoned = req.query.includeSummoned || false;
    }
    if(req.query.includeJurorsOnCall) {
      config.includeJurorsOnCall = req.query.includeJurorsOnCall;
    }
    if(req.query.respondedJurorsOnly) {
      config.respondedJurorsOnly = req.query.respondedJurorsOnly;
    }
    if(req.query.includePanelMembers) {
      config.includePanelMembers = req.query.includePanelMembers;
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
        ? reportType.bespokeReport.dao(req, config)
        : standardReportDAO.post(req, app, config));

      if (isPrint) return standardReportPrint(app, req, res, reportKey, { headings, tableData });
      if (isExport) return reportExport(app, req, res, reportKey, { headings, tableData }) ;
      let tables = [];

      if (reportType.bespokeReport && reportType.bespokeReport.body) {
        tables = bespokeReportBodys(app, req)[reportKey](reportType, tableData)
      } else if (reportType.multiTable) {
        for (const [key, value] of Object.entries(tableData.data)) {
          tables.push(...buildStandardTable(reportType, value, tableData.headings, reportType.multiTable.sectionHeadings ? key : ''));
        }
      } else {
        tables = buildStandardTable(reportType, tableData.data, tableData.headings);
      }

      if (reportType.bespokeReport && reportType.bespokeReport.insertTables) {
        Object.keys(reportType.bespokeReport.insertTables).map((key) => {
          if (key === 'last') {
            tables.push(...reportType.bespokeReport.insertTables[key](tableData))
          } else {
            tables.splice(key, 0, ...reportType.bespokeReport.insertTables[key](tableData));
          }
        });
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
        largeTotals: reportType.largeTotals?.values ? reportType.largeTotals.values(tableData.data) : [],
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

        return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.filter.get`)+ (req.body.filter ? '?filter=' + req.body.filter : '')));
      }

      req.session.reportFilter = req.body.filter;

      return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.report.get`, {
        filter: req.body.reportPool,
      })));
    }

    if (reportType.search === 'jurorNumber') {
      if (!req.body.jurorNumberToPrint || req.body.jurorNumberToPrint === '') {
        req.session.errors = {
          selection: [{
            fields: ['selection'],
            summary: 'Select a juror',
            details: ['Select a juror'],
          }],
        };

        return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.filter.get`) + (req.body.filter ? '?filter=' + req.body.filter : '')));
      }
      
      req.session.reportFilter = req.body.filter;

      return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.report.get`, {
        filter: req.body.jurorNumberToPrint,
      })));
    }
    if (reportType.search === 'courts') {
      if (!req.body.selectedCourts) {
        req.session.errors = makeManualError('selectedCourts', 'Select at least one court');

        return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.filter.get`)
          + (req.body.filter ? '?filter=' + req.body.filter : '')));
      }
      req.session.reportFilter = req.body.filter;
      const selectedCourts = Array.isArray(req.body.selectedCourts) ? req.body.selectedCourts : [req.body.selectedCourts]
      const courtLocCodes = selectedCourts.map((court) => {
        return court.match(/\d+/g)[0];
      });
      delete req.session.courtsList
      req.session.reportCourts = courtLocCodes;
      return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.report.get`, { filter: 'courts' })));
    }
    if (reportType.search === 'dateRange' || reportType.search === 'fixedDateRange') {
      if (req.body.dateRange && req.body.dateRange === 'NEXT_31_DAYS') {
        req.body.dateFrom = moment().format('DD/MM/YYYY');
        req.body.dateTo = moment().add(31, 'days').format('DD/MM/YYYY');
      }
      if (req.body.dateRange && req.body.dateRange === 'LAST_31_DAYS') {
        req.body.dateFrom = moment().subtract(31, 'days').format('DD/MM/YYYY');
        req.body.dateTo = moment().format('DD/MM/YYYY');
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
        return res.redirect(addURLQueryParams(reportType, app.namedRoutes.build(`reports.${reportKey}.filter.get`)));
      }

      if (reportKey === 'daily-utilisation') { 
        if((toDate.diff(fromDate, 'days') + 1) > 31) {
          req.session.errors = makeManualError('dateTo', 'Date range cannot be larger than 31 days');
          req.session.formFields = req.body;
          return res.redirect(addURLQueryParams(reportType,  app.namedRoutes.build(`reports.${reportKey}.filter.get`)));
        }
        redirectRoute = `reports.daily-utilisation.check.get`
      }

      if (reportType.exportOnly) {
        redirectRoute = `reports.${reportKey}.report.export`;
      }

      return res.redirect(addURLQueryParams(reportType,  app.namedRoutes.build(redirectRoute, {filter: 'dateRange'})
        + `?fromDate=${dateFilter(req.body.dateFrom, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
        + `&toDate=${dateFilter(req.body.dateTo, 'DD/MM/YYYY', 'YYYY-MM-DD')}`
        ));
    }
    if (reportType.search === 'trial') {
      if (!req.body.selectedTrial) {
        req.session.errors = makeManualError('selectedTrial', 'Select a trial')
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build(`reports.${reportKey}.filter.get`));
      }
      return res.redirect(app.namedRoutes.build(`reports.${reportKey}.report.get`, { filter: req.body.selectedTrial }))
    }
  };

  function addURLQueryParams(reportType, url){
    let queryParams = _.clone(reportType.queryParams);

    if(url.includes('?')) {
      url
        .split('?')[1]
        .split('&')
        .map((param) => param.split('=')[0])
        .forEach((param) => {
          if (queryParams && queryParams[param]) {
            delete queryParams[param];
          }
        });
    }

    return url + `${reportType.queryParams ? `${url.includes('?') ? '&' : '?'}${new URLSearchParams(queryParams).toString()}` : ''}`
  }

  module.exports = {
    standardFilterGet,
    standardFilterPost,
    standardReportGet,
    standardReportPost,
  };
})();
