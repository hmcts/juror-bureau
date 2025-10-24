const auth = require('../../../components/auth');
const { isBureauUser } = require('../../../components/auth/user-type');
const { checkRouteParam } = require('../../../lib/mod-utils');
const {
  getJurySummoningMonitorSearch,
  postJurySummoningMonitorSearch,
  getJurySummoningMonitorReport,
  getJurySummoningMonitorReportFilterByDate,
  postJurySummoningMonitorReportFilterByDate,
} = require('./jury-summoning-monitor.controller');

module.exports = (app) => {
  // search routes
  app.get('/reporting/jury-summoning-monitor',
    'reports.jury-summoning-monitor.search.get',
    auth.verify,
    isBureauUser,
    getJurySummoningMonitorSearch(app),
  );
  app.post('/reporting/jury-summoning-monitor',
    'reports.jury-summoning-monitor.search.post',
    auth.verify,
    isBureauUser,
    postJurySummoningMonitorSearch(app),
  );

  // filter by date after court search
  // set a :type here in case we need to extend it to pool aswel
  app.get('/reporting/jury-summoning-monitor/:type/filter-by-date',
    'reports.jury-summoning-monitor.filter-by-date.get',
    auth.verify,
    checkRouteParam('type', ['court']),
    isBureauUser,
    getJurySummoningMonitorReportFilterByDate(app),
  );
  app.post('/reporting/jury-summoning-monitor/:type/filter-by-date',
    'reports.jury-summoning-monitor.filter-by-date.post',
    auth.verify,
    checkRouteParam('type', ['court']),
    isBureauUser,
    postJurySummoningMonitorReportFilterByDate(app),
  );

  // report views
  app.get('/reporting/jury-summoning-monitor/:type/report/:filter',
    'reports.jury-summoning-monitor.report.get',
    auth.verify,
    checkRouteParam('type', ['pool', 'court']),
    isBureauUser,
    getJurySummoningMonitorReport(app),
  );

  // report print
  app.get('/reporting/jury-summoning-monitor/:type/report/:filter/print',
    'reports.jury-summoning-monitor.report.print',
    auth.verify,
    checkRouteParam('type', ['pool', 'court']),
    isBureauUser,
    getJurySummoningMonitorReport(app, true),
  );
};
