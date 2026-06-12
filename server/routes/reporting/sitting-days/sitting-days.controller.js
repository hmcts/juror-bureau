(function () {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter } = require('../../../components/filters');
  const { generateDocument } = require('../../../lib/reports/single-generator');
  const {
    getLocCodeFromCourtNameOrLocation,
    makeManualError,
    transformCourtName,
  } = require('../../../lib/mod-utils');
  const { fetchAllCourtsDAO, sittingDaysStatsReportDAO } = require('../../../objects');
  const { tableDataMappers } = require('../standard-report/utils');

  const REPORT_TITLE = 'Sitting days report';
  const REPORT_START_MONTH = '2021-01-01';
  const NUMERIC_DATA_TYPES = ['Long', 'Integer', 'BigDecimal', 'Double'];

  function buildErrorView (errors) {
    return {
      title: 'Please check your search',
      count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
      items: errors,
    };
  }

  function consumeErrors (req) {
    const tmpErrors = _.clone(req.session.errors);
    const tmpBody = _.clone(req.session.formFields);

    delete req.session.errors;
    delete req.session.formFields;

    return { tmpErrors, tmpBody };
  }

  function initialiseSession (req) {
    req.session.sittingDays = req.session.sittingDays || {};
    req.session.sittingDays.courtLocCodes = req.session.sittingDays.courtLocCodes || [];
  }

  function getSession (req) {
    return req.session.sittingDays;
  }

  function ensureSession (req, res, app) {
    if (!getSession(req)) {
      res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      return false;
    }

    return true;
  }

  function ensureDates (req, res, app) {
    const sittingDays = getSession(req);

    if (!ensureSession(req, res, app)) {
      return false;
    }

    if (!sittingDays.fromDate || !sittingDays.toDate) {
      res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      return false;
    }

    return true;
  }

  function ensureCourtScope (req, res, app) {
    const sittingDays = getSession(req);

    if (!ensureDates(req, res, app)) {
      return false;
    }

    if (typeof sittingDays.allCourts === 'undefined') {
      res.redirect(app.namedRoutes.build('reports.sitting-days.filter.courts.get'));
      return false;
    }

    return true;
  }

  function ensureSelectedCourts (req, res, app) {
    const sittingDays = getSession(req);

    if (!ensureCourtScope(req, res, app)) {
      return false;
    }

    sittingDays.courtLocCodes = sittingDays.courtLocCodes || [];

    if (!sittingDays.allCourts && !sittingDays.courtLocCodes.length) {
      res.redirect(app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'));
      return false;
    }

    return true;
  }

  function asArray (value) {
    if (typeof value === 'undefined') {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  function extractCourtLocCodes (selectedCourts) {
    return _.uniq(asArray(selectedCourts)
      .map(getLocCodeFromCourtNameOrLocation)
      .filter(Boolean)
      .map((locCode) => locCode.toString()));
  }

  function updateSelectedCourts (req, selectedCourts) {
    req.session.sittingDays.courtLocCodes = extractCourtLocCodes(selectedCourts);
  }

  function displayMonth (date) {
    return date ? dateFilter(date, 'yyyy-MM-DD', 'MMMM YYYY') : '';
  }

  function displayReportDate (date) {
    return date ? dateFilter(date, null, 'DD/MM/YYYY') : '-';
  }

  function displayReportTime (date) {
    return date ? dateFilter(date, null, 'h:mm:ss a') : '-';
  }

  function selectedMonthValue (date) {
    if (!date) {
      return undefined;
    }

    return moment(date, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
  }

  function buildMonthItems (selectedMonth) {
    const months = [];
    const currentMonth = moment().startOf('month');
    const month = moment(REPORT_START_MONTH, 'YYYY-MM-DD');

    while (!month.isAfter(currentMonth, 'month')) {
      const value = month.format('YYYY-MM-DD');

      months.push({
        value,
        text: month.format('MMMM YYYY'),
        selected: value === selectedMonth,
      });

      month.add(1, 'month');
    }

    return months;
  }

  function isInReportMonthRange (month) {
    return !month.isBefore(moment(REPORT_START_MONTH, 'YYYY-MM-DD'), 'month')
      && !month.isAfter(moment().startOf('month'), 'month');
  }

  function appendQuery (url, query) {
    const params = Object.keys(query || {})
      .filter((key) => typeof query[key] !== 'undefined' && query[key] !== '')
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`);

    if (!params.length) {
      return url;
    }

    return `${url}?${params.join('&')}`;
  }

  function buildCourtItems (courts, selectedCourtLocCodes, filter) {
    const searchTerm = (filter || '').toLowerCase();

    return courts
      .filter((court) => court.locationCode !== '400')
      .sort((court1, court2) => court1.locationCode - court2.locationCode)
      .map((court) => {
        const locCode = court.locationCode.toString();
        const name = transformCourtName(court);

        return {
          name,
          locCode,
          checked: selectedCourtLocCodes.includes(locCode),
        };
      })
      .filter((court) => !searchTerm || court.name.toLowerCase().includes(searchTerm));
  }

  function formatCellValue (value, dataType) {
    if (value === null || typeof value === 'undefined' || value === '') {
      return NUMERIC_DATA_TYPES.includes(dataType) ? '0' : '-';
    }

    const mapper = tableDataMappers[dataType];
    const formatted = mapper ? mapper(value) : value.toString();

    if (NUMERIC_DATA_TYPES.includes(dataType) && formatted === '-') {
      return '0';
    }

    return formatted || '-';
  }

  function buildTable (reportData) {
    const tableData = reportData?.tableData || {};
    const headings = tableData.headings || [];
    const rows = tableData.data || [];

    return {
      headers: headings.map((heading) => ({
        text: heading.name,
        format: NUMERIC_DATA_TYPES.includes(heading.dataType) ? 'numeric' : '',
      })),
      rows: rows.map((row) => headings.map((heading) => {
        const key = _.camelCase(heading.id);

        return {
          text: formatCellValue(row[key], heading.dataType),
          format: NUMERIC_DATA_TYPES.includes(heading.dataType) ? 'numeric' : '',
        };
      })),
      hasRows: rows.length > 0,
    };
  }

  function buildPrintMetadata (pageHeadings) {
    const buildReportHeadings = (headings) => headings.map((heading) => ({
      key: heading.title,
      value: heading.data,
    }));

    return {
      left: buildReportHeadings(pageHeadings.filter((heading, index) => index % 2 === 0)),
      right: buildReportHeadings(pageHeadings.filter((heading, index) => index % 2 === 1)),
    };
  }

  function buildPrintTable (reportData) {
    const tableData = reportData?.tableData || {};
    const headings = tableData.headings || [];
    const rows = tableData.data || [];
    const columnCount = headings.length || 1;
    const noResultsRow = [{ text: 'No results found', colSpan: columnCount }];

    for (let i = 1; i < columnCount; i++) {
      noResultsRow.push({});
    }

    return [{
      head: headings.length
        ? headings.map((heading) => ({
          text: heading.name,
          style: 'label',
          alignment: NUMERIC_DATA_TYPES.includes(heading.dataType) ? 'right' : 'left',
        }))
        : [{ text: 'Sitting days report data', style: 'label' }],
      body: rows.length
        ? rows.map((row) => headings.map((heading) => {
          const key = _.camelCase(heading.id);

          return {
            text: formatCellValue(row[key], heading.dataType),
            alignment: NUMERIC_DATA_TYPES.includes(heading.dataType) ? 'right' : 'left',
          };
        }))
        : [noResultsRow],
      footer: [],
      widths: headings.length
        ? headings.map((heading, index) => index === 0 ? '18%' : '*')
        : ['*'],
      margin: [0, 10, 0, 0],
    }];
  }

  function getHeadingValue (headings, keys) {
    const headingKey = keys.find((candidateKey) => headings?.[candidateKey]);

    if (!headingKey) {
      return null;
    }

    return headings[headingKey].value;
  }

  function buildPageHeadings (sittingDays, reportData) {
    const headings = reportData?.headings || {};
    const reportCreated = getHeadingValue(headings, ['reportCreated']);
    const timeCreated = getHeadingValue(headings, ['timeCreated', 'reportCreated']);

    return [
      { title: 'Date from', data: displayMonth(sittingDays.fromDate) },
      { title: 'Report created', data: displayReportDate(reportCreated) },
      { title: 'Date to', data: displayMonth(sittingDays.toDate) },
      { title: 'Time created', data: displayReportTime(timeCreated) },
      {
        title: 'Total jurors',
        data: getHeadingValue(headings, ['totalNumberOfJurors', 'totalJurors', 'noJurors']) || '0',
      },
      {
        title: 'Total sitting days',
        data: getHeadingValue(headings, ['totalSittingDays', 'noSittingDays']) || '0',
      },
      {
        title: 'Courts',
        data: sittingDays.allCourts ? 'All courts' : `${sittingDays.courtLocCodes.length} selected`,
      },
    ];
  }

  function buildPayload (sittingDays) {
    return {
      allCourts: sittingDays.allCourts,
      courtLocCodes: sittingDays.allCourts ? [] : sittingDays.courtLocCodes,
      fromDate: sittingDays.fromDate,
      toDate: sittingDays.toDate,
    };
  }

  function fetchReport (req) {
    return sittingDaysStatsReportDAO.post(req, buildPayload(getSession(req)));
  }

  function escapeCsv (value) {
    const stringValue = value === null || typeof value === 'undefined' ? '' : value.toString();

    if (/[",\n\r]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  function toCsv (rows) {
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  }

  function buildCsvRows (sittingDays, reportData) {
    const tableData = reportData?.tableData || {};
    const headings = tableData.headings || [];
    const rows = tableData.data || [];
    const csvRows = [
      [REPORT_TITLE],
      [],
      ['Date from', displayMonth(sittingDays.fromDate)],
      ['Date to', displayMonth(sittingDays.toDate)],
      ['Courts', sittingDays.allCourts ? 'All courts' : `${sittingDays.courtLocCodes.length} selected`],
      [],
      headings.map((heading) => heading.name),
    ];

    rows.forEach((row) => {
      csvRows.push(headings.map((heading) => {
        const key = _.camelCase(heading.id);

        return formatCellValue(row[key], heading.dataType);
      }));
    });

    return csvRows;
  }

  function logReportError (app, req, err) {
    app.logger.crit('Failed to generate sitting days report: ', {
      auth: req.session.authentication,
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });
  }

  module.exports.getCourtScope = function (app) {
    return function (req, res) {
      if (!ensureDates(req, res, app)) {
        return;
      }

      const { tmpErrors, tmpBody } = consumeErrors(req);
      const sittingDays = getSession(req);
      const courtSelection = typeof sittingDays.allCourts === 'boolean'
        ? sittingDays.allCourts ? 'all' : 'selected'
        : undefined;
      const body = tmpBody || {};

      return res.render('reporting/sitting-days/select-courts', {
        errors: buildErrorView(tmpErrors),
        tmpBody: {
          ...body,
          courts: body.courts || courtSelection,
        },
        title: REPORT_TITLE,
        processUrl: app.namedRoutes.build('reports.sitting-days.filter.courts.post'),
        cancelUrl: app.namedRoutes.build('reports.reports.get'),
        backLinkUrl: {
          built: true,
          url: app.namedRoutes.build('reports.sitting-days.filter.dates.get'),
        },
      });
    };
  };

  module.exports.postCourtScope = function (app) {
    return function (req, res) {
      if (!ensureDates(req, res, app)) {
        return;
      }

      if (!req.body.courts) {
        req.session.errors = makeManualError('courts', 'Select which courts to include');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.courts.get'));
      }

      req.session.sittingDays.allCourts = req.body.courts === 'all';

      if (req.body.courts === 'all') {
        req.session.sittingDays.courtLocCodes = [];

        return res.redirect(app.namedRoutes.build('reports.sitting-days.report.get'));
      }

      req.session.sittingDays.courtLocCodes = req.session.sittingDays.courtLocCodes || [];

      return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'));
    };
  };

  module.exports.getSelectedCourts = function (app) {
    return async function (req, res) {
      if (!ensureDates(req, res, app)) {
        return;
      }

      const sittingDays = getSession(req);

      if (typeof sittingDays.allCourts === 'undefined') {
        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.courts.get'));
      }

      if (sittingDays.allCourts) {
        return res.redirect(app.namedRoutes.build('reports.sitting-days.report.get'));
      }

      if (req.query.clearSelected === 'true') {
        sittingDays.courtLocCodes = [];
      }

      if (req.query.selectionSubmitted === 'true') {
        updateSelectedCourts(req, req.query.selectedCourts);
      }

      const { tmpErrors } = consumeErrors(req);
      const filter = req.query.filter || '';

      try {
        const courtsData = await fetchAllCourtsDAO.get(req);
        const selectedCourtLocCodes = sittingDays.courtLocCodes || [];
        const courts = buildCourtItems(courtsData.courts || [], selectedCourtLocCodes, filter);
        const visibleCourtLocCodes = courts.map((court) => court.locCode);
        const selectedHiddenCourts = selectedCourtLocCodes
          .filter((locCode) => !visibleCourtLocCodes.includes(locCode));
        const clearSelectionUrl = appendQuery(
          app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'),
          { filter, clearSelected: 'true' },
        );

        return res.render('reporting/sitting-days/selected-courts', {
          errors: buildErrorView(tmpErrors),
          title: REPORT_TITLE,
          courts,
          filter,
          selectedCount: selectedCourtLocCodes.length,
          selectedHiddenCourts,
          filterUrl: app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'),
          clearFilterUrl: app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'),
          clearSelectionUrl,
          reportUrl: app.namedRoutes.build('reports.sitting-days.filter.selected-courts.post'),
          cancelUrl: app.namedRoutes.build('reports.reports.get'),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('reports.sitting-days.filter.courts.get'),
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch courts list for sitting days report: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postSelectedCourts = function (app) {
    return function (req, res) {
      if (!ensureDates(req, res, app)) {
        return;
      }

      req.session.sittingDays.allCourts = false;
      updateSelectedCourts(req, req.body.selectedCourts);

      if (!req.session.sittingDays.courtLocCodes.length) {
        req.session.errors = makeManualError('selectedCourts', 'Select at least one court');

        return res.redirect(appendQuery(app.namedRoutes.build('reports.sitting-days.filter.selected-courts.get'), {
          filter: req.body.filter,
        }));
      }

      return res.redirect(app.namedRoutes.build('reports.sitting-days.report.get'));
    };
  };

  module.exports.getAttendanceDates = function (app) {
    return function (req, res) {
      const { tmpErrors, tmpBody } = consumeErrors(req);
      const sittingDays = getSession(req);
      const selectedMonthFrom = tmpBody?.selectMonthFrom || selectedMonthValue(sittingDays?.fromDate);
      const selectedMonthTo = tmpBody?.selectMonthTo || selectedMonthValue(sittingDays?.toDate);

      return res.render('reporting/sitting-days/month-range-select', {
        errors: buildErrorView(tmpErrors),
        tmpBody: tmpBody || {},
        monthsFrom: buildMonthItems(selectedMonthFrom),
        monthsTo: buildMonthItems(selectedMonthTo),
        reportName: REPORT_TITLE,
        processUrl: app.namedRoutes.build('reports.sitting-days.filter.dates.post'),
        cancelUrl: app.namedRoutes.build('reports.reports.get'),
      });
    };
  };

  module.exports.postAttendanceDates = function (app) {
    return function (req, res) {
      if (!req.body.selectMonthFrom) {
        req.session.errors = makeManualError('selectMonthFrom', 'Select a month from');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      if (!req.body.selectMonthTo) {
        req.session.errors = makeManualError('selectMonthTo', 'Select a month to');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      const selectedMonthFrom = moment(req.body.selectMonthFrom, 'YYYY-MM-DD', true);
      const selectedMonthTo = moment(req.body.selectMonthTo, 'YYYY-MM-DD', true);

      if (!selectedMonthFrom.isValid()) {
        req.session.errors = makeManualError('selectMonthFrom', 'Select a real month from');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      if (!selectedMonthTo.isValid()) {
        req.session.errors = makeManualError('selectMonthTo', 'Select a real month to');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      if (!isInReportMonthRange(selectedMonthFrom)) {
        req.session.errors = makeManualError(
          'selectMonthFrom',
          'Month from must be between January 2021 and the current month',
        );
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      if (!isInReportMonthRange(selectedMonthTo)) {
        req.session.errors = makeManualError(
          'selectMonthTo',
          'Month to must be between January 2021 and the current month',
        );
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      if (selectedMonthTo.isBefore(selectedMonthFrom, 'month')) {
        req.session.errors = makeManualError('selectMonthTo', 'Month to cannot be before month from');
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.dates.get'));
      }

      initialiseSession(req);
      req.session.sittingDays.fromDate = selectedMonthFrom.clone().startOf('month').format('YYYY-MM-DD');
      req.session.sittingDays.toDate = selectedMonthTo.clone().endOf('month').format('YYYY-MM-DD');

      return res.redirect(app.namedRoutes.build('reports.sitting-days.filter.courts.get'));
    };
  };

  module.exports.getReport = function (app) {
    return async function (req, res) {
      if (!ensureSelectedCourts(req, res, app)) {
        return;
      }

      try {
        const reportData = await fetchReport(req);
        const table = buildTable(reportData);

        return res.render('reporting/sitting-days/report', {
          title: REPORT_TITLE,
          pageHeadings: buildPageHeadings(getSession(req), reportData),
          tableHeaders: table.headers,
          tableRows: table.rows,
          hasRows: table.hasRows,
          exportUrl: table.hasRows
            ? app.namedRoutes.build('reports.sitting-days.report.export')
            : null,
          printUrl: app.namedRoutes.build('reports.sitting-days.report.print'),
          changeDatesUrl: app.namedRoutes.build('reports.sitting-days.filter.dates.get'),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('reports.sitting-days.filter.dates.get'),
          },
        });
      } catch (err) {
        logReportError(app, req, err);

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.printReport = function (app) {
    return async function (req, res) {
      if (!ensureSelectedCourts(req, res, app)) {
        return;
      }

      try {
        const reportData = await fetchReport(req);
        const pageHeadings = buildPageHeadings(getSession(req), reportData);
        const document = await generateDocument({
          title: REPORT_TITLE,
          footerText: REPORT_TITLE,
          metadata: buildPrintMetadata(pageHeadings),
          tables: buildPrintTable(reportData),
        }, {
          pageOrientation: 'landscape',
          fontSize: 8,
        });

        res.contentType('application/pdf');
        return res.send(document);
      } catch (err) {
        app.logger.crit('Something went wrong when printing the sitting days report: ', {
          auth: req.session.authentication,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.exportReport = function (app) {
    return async function (req, res) {
      if (!ensureSelectedCourts(req, res, app)) {
        return;
      }

      try {
        const reportData = await fetchReport(req);
        const table = buildTable(reportData);

        if (!table.hasRows) {
          return res.redirect(app.namedRoutes.build('reports.sitting-days.report.get'));
        }

        const sittingDays = getSession(req);
        const filename = `sitting_days_${sittingDays.fromDate}_${sittingDays.toDate}.csv`;

        res.set('content-disposition', 'attachment; filename=' + filename);
        res.type('csv');

        return res.send(toCsv(buildCsvRows(sittingDays, reportData)));
      } catch (err) {
        logReportError(app, req, err);

        return res.render('_errors/generic', { err });
      }
    };
  };

})();
