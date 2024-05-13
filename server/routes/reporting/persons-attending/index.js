
(() => {
  'use strict';

  const { getFilterAttendanceDate, postFilterAttendanceDate } = require('./persons-attending-controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/reporting/persons-attending-summary',
      'reports.persons-attending-summary.filter.get',
      auth.verify,
      getFilterAttendanceDate(app));
    app.post('/reporting/persons-attending-summary',
      'reports.persons-attending-summary.filter.post',
      auth.verify,
      postFilterAttendanceDate(app));
  };
})();
