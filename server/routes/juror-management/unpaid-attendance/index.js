const { isCourtUser } = require('../../../components/auth/user-type');

(function() {
  'use strict';

  const controller = require('./unpaid-attendance.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {

    require('./expense-record')(app);

    app.get('/juror-management/unpaid-attendance',
      'juror-management.unpaid-attendance.get',
      auth.verify,
      isCourtUser,
      controller.getUnpaidAttendance(app),
    );

    app.post('/juror-management/unpaid-attendance',
      'juror-management.unpaid-attendance.post',
      auth.verify,
      isCourtUser,
      controller.postUnpaidAttendance(app),
    );

  };

})();
