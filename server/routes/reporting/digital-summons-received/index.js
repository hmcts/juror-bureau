
(() => {
  'use strict';

  const {
    getDigitalSummonsReportMonth,
    postDigitalSummonsReportMonth,
  } = require('./digital-summons-received.controller');
  const auth = require('../../../components/auth');
  const { isBureauManager } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/reporting/digital-summons-received',
      'reports.digital-summons-received.filter.get',
      auth.verify,
      isBureauManager,
      getDigitalSummonsReportMonth(app));
    app.post('/reporting/digital-summons-received',
      'reports.digital-summons-received.filter.post',
      auth.verify,
      isBureauManager,
      postDigitalSummonsReportMonth(app));
  };
})();
