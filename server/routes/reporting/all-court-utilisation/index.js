(() => {
  'use strict';

  const {
    getSelectCourts,
    postSelectCourts,
  } = require('./all-court-utilisation.controller');
  const auth = require('../../../components/auth');
  const { isSuperUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/reporting/all-court-utilisation/select',
      'reports.all-court-utilisation.filter.select.get',
      auth.verify,
      isSuperUser,
      getSelectCourts(app));
    app.post('/reporting/all-court-utilisation/select',
      'reports.all-court-utilisation.filter.select.post',
      auth.verify,
      isSuperUser,
      postSelectCourts(app));
  };
})();
