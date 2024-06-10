const auth = require('../../../components/auth');
const { isBureauUser } = require('../../../components/auth/user-type');
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
  app.get('/reporting/jury-summoning-monitor/:type(court)/filter-by-date',
    'reports.jury-summoning-monitor.filter-by-date.get',
    auth.verify,
    isBureauUser,
    getJurySummoningMonitorReportFilterByDate(app),
  );
  app.post('/reporting/jury-summoning-monitor/:type(court)/filter-by-date',
    'reports.jury-summoning-monitor.filter-by-date.post',
    auth.verify,
    isBureauUser,
    postJurySummoningMonitorReportFilterByDate(app),
  );

  // report views
  app.get('/reporting/jury-summoning-monitor/:type(pool|court)/report/:filter',
    'reports.jury-summoning-monitor.report.get',
    auth.verify,
    isBureauUser,
    getJurySummoningMonitorReport(app),
  );

  // report print
  app.get('/reporting/jury-summoning-monitor/:type(pool|court)/report/:filter/print',
    'reports.jury-summoning-monitor.report.print',
    auth.verify,
    isBureauUser,
    getJurySummoningMonitorReport(app, true),
  );
};
