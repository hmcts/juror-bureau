;(function() {
  'use strict';

  var controller = require('./request-pool.controller')
    , auth = require('../../../components/auth')
    , user = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/pool-management/request-pool/select-court',
      'request-pool.select-court.get',
      auth.verify,
      controller.getSelectCourt(app));
    app.post('/pool-management/request-pool/select-court',
      'request-pool.select-court.post',
      auth.verify,
      controller.postSelectCourt(app));

    app.get('/pool-management/request-pool/pool-details',
      'request-pool.pool-details.get',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.getPoolDetails(app));
    app.post('/pool-management/request-pool/pool-details',
      'request-pool.pool-details.post',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.postPoolDetails(app));

    app.get('/pool-management/request-pool/change-attendance-date',
      'request-pool.change-attendance-date.get',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.getChangeAttendanceDate(app));
    app.post('/pool-management/request-pool/change-attendance-date',
      'request-pool.change-attendance-date.post',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.postChangeAttendanceDate(app));

    app.get('/pool-management/request-pool/invalid-date',
      'request-pool.invalid-date.get',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.getInvalidDate(app));

    app.get('/pool-management/request-pool/check-details',
      'request-pool.check-details.get',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.getCheckDetails(app));
    app.post('/pool-management/request-pool/check-details',
      'request-pool.check-details.post',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.postCheckDetails(app));

    app.get('/pool-management/request-pool/change-deferrals',
      'request-pool.change-deferrals.get',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.getChangeDeferrals(app));
    app.post('/pool-management/request-pool/change-deferrals',
      'request-pool.change-deferrals.post',
      auth.verify,
      controller.hasStartedRequest(app),
      controller.postChangeDeferrals(app));

    app.get('/pool-management/request-pool/change-attendance-time',
      'request-pool.change-attendance-time.get',
      auth.verify,
      user.isCourtUser,
      controller.hasStartedRequest(app),
      controller.getChangeAttendanceTime(app));
    app.post('/pool-management/request-pool/change-attendance-time',
      'request-pool.change-attendance-time.post',
      auth.verify,
      user.isCourtUser,
      controller.hasStartedRequest(app),
      controller.postChangeAttendanceTime(app));

    app.get('/pool-management/request-pool/change-pool-number',
      'request-pool.change-pool-number.get',
      auth.verify,
      user.isBureauUser,
      controller.hasStartedRequest(app),
      controller.getChangePoolNumber(app));
    app.post('/pool-management/request-pool/change-pool-number',
      'request-pool.change-pool-number.post',
      auth.verify,
      user.isBureauUser,
      controller.hasStartedRequest(app),
      controller.postChangePoolNumber(app));
  };

})();
