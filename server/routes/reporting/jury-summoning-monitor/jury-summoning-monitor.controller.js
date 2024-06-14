const _ = require('lodash');
const moment = require('moment');
const { validate } = require('validate.js');
const { makeManualError, mapSnakeToCamel } = require('../../../lib/mod-utils');
const { jurySummoningMonitorDAO } = require('../../../objects/reports');
const { dateRange } = require('../../../config/validation/report-search-by');
const { constructPageHeading } = require('../standard-report/utils');
const { reportKeys } = require('../standard-report/definitions');
const printJurySummoningMonitorReport = require('./jury-summoning-monitor-print');

module.exports.getJurySummoningMonitorSearch = () => (req, res) => {
  const errors = _.clone(req.session.errors);

  delete req.session.errors;

  return res.render('reporting/jury-summoning-monitor/index.njk', {
    errors: {
      title: 'Please check your search',
      count: typeof errors !== 'undefined' ? Object.keys(errors).length : 0,
      items: errors,
    },
  });
};

module.exports.postJurySummoningMonitorSearch = (app) => (req, res) => {
  const { jurySummoningMonitorSearchType } = req.body;

  if (!jurySummoningMonitorSearchType || jurySummoningMonitorSearchType === '') {
    req.session.errors = makeManualError('jurySummoningMonitorSearchType',
      'Select whether you want to search by court or pool number');

    return res.redirect(app.namedRoutes.build('reports.jury-summoning-monitor.search.get'));
  }

  if (jurySummoningMonitorSearchType === 'court') {
    return res.redirect(app.namedRoutes.build('reports.jury-summoning-monitor-court.filter.get'));
  }

  if (jurySummoningMonitorSearchType === 'poolNumber') {
    return res.redirect(app.namedRoutes.build('reports.jury-summoning-monitor-pool.filter.get'));
  }

  app.logger.crit('Invalid search type', {
    auth: req.session.authentication,
    error: 'Invalid search type was used for jury-summoning-monitor search',
  });

  return res.render('_errors/generic');
};

module.exports.getJurySummoningMonitorReportFilterByDate = (app) => async (req, res) => {
  const { type } = req.params;
  const tmpErrors = _.clone(req.session.errors);

  delete req.session.errors;

  const reportUrl = app.namedRoutes.build('reports.jury-summoning-monitor.filter-by-date.post', { type });
  const cancelUrl = app.namedRoutes.build('reports.reports.get');

  return res.render('reporting/standard-reports/date-search', {
    errors: {
      title: 'Please check your search',
      count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
      items: tmpErrors,
    },
    title: 'Jury summoning monitor report (by court)',
    customSearchLabel: 'Enter attendance dates to search',
    reportUrl,
    cancelUrl,
  });
};

module.exports.postJurySummoningMonitorReportFilterByDate = (app) => async (req, res) => {
  const { type } = req.params;

  const redirectBack = app.namedRoutes.build('reports.jury-summoning-monitor.filter-by-date.get', {
    type,
  });

  const validatorResult = validate(req.body, dateRange('attendanceData', req.body));
  if (typeof validatorResult !== 'undefined') {
    req.session.errors = validatorResult;
    req.session.formFields = req.body;

    return res.redirect(redirectBack);
  }

  const fromDate = moment(req.body.dateFrom, 'DD/MM/YYYY');
  const toDate = moment(req.body.dateTo, 'DD/MM/YYYY');

  if (toDate.isBefore(fromDate)) {
    req.session.errors = makeManualError('dateTo', '‘Date to’ cannot be before ‘date from’');
    req.session.formFields = req.body;

    return res.redirect(redirectBack);
  }

  return res.redirect(app.namedRoutes.build('reports.jury-summoning-monitor.report.get', {
    type,
    filter: 'dateRange',
  }) + `?fromDate=${fromDate.format('YYYY-MM-DD')}&toDate=${toDate.format('YYYY-MM-DD')}`);
};

module.exports.getJurySummoningMonitorReport = (app, isPrint = false) => async (req, res) => {
  const { type, filter } = req.params;
  let response;

  let courts;
  const totalCourts = (req.session.totalCourts - 1);

  if (type === 'court') {
    // this is already cached from when we check how many courts we need to filter by
    courts = req.session.reportCourts;
  }

  const body = buildPayload(req, { courts, totalCourts });

  try {
    response = await jurySummoningMonitorDAO.post(req, body);
  } catch (err) {

    app.logger.crit('Failed to fetch and load the jury summoning monitor report', {
      auth: req.session.authentication,
      data: { ...body },
      error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
    });

    return res.render('_errors/generic');
  }

  const reportType = reportKeys(app, req)[`jury-summoning-monitor-${type}`];

  const pageHeadings = reportType.headings.map(heading => constructPageHeading(heading, response.headings));
  const title = `Jury summoning monitor report (${type === 'court' ? 'by court' : 'by pool'})`;

  delete response.headings;
  delete response.Headers;

  let printUrl = app.namedRoutes.build('reports.jury-summoning-monitor.report.print', {
    type,
    filter,
  });

  if (filter === 'dateRange') {
    printUrl += `?fromDate=${req.query.fromDate}&toDate=${req.query.toDate}`;
  }

  if (isPrint) {
    return printJurySummoningMonitorReport(app, req, res, reportType, { pageHeadings, data: response });
  }

  return res.render('reporting/standard-reports/standard-report.njk', {
    title,
    pageHeadings,
    bespokeReportFile: '../jury-summoning-monitor/report.njk',
    data: mapSnakeToCamel(response),
    printUrl,
  });
};

function buildPayload (req, { courts, totalCourts }) {
  const { type, filter } = req.params;
  const { fromDate, toDate } = req.query;

  const body = {
    'search_by': type.toUpperCase(),
  };

  if (type === 'pool') {
    body['pool_number'] = filter;
  }

  if (type === 'court') {
    if (courts.length === totalCourts) {
      body['all_courts'] = true;
    } else {
      body['court_loc_codes'] = courts;
    }

    body['from_date'] = fromDate;
    body['to_date'] = toDate;
  }

  return body;
}
