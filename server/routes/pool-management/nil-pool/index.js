;(function() {
  'use strict';

  var controller = require('./nil-pool.controller')
    , auth = require('../../../components/auth');

  module.exports = function(app) {
    app.get('/pool-management/nil-pool',
      'nil-pool.get',
      auth.verify,
      controller.index(app));
    app.post('/pool-management/nil-pool',
      'nil-pool.post',
      auth.verify,
      controller.post(app));

    app.get('/pool-management/nil-pool/change-court',
      'nil-pool.change-court.get',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.getChangeCourt(app));
    app.post('/pool-management/nil-pool/change-court',
      'nil-pool.change-court.post',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.postChangeCourt(app));

    app.get('/pool-management/nil-pool/change-attendance-date',
      'nil-pool.change-attendance-date.get',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.getChangeAttendanceDate(app));
    app.post('/pool-management/nil-pool/change-attendance-date',
      'nil-pool.change-attendance-date.post',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.postChangeAttendanceDate(app));

    app.get('/pool-management/nil-pool/invalid-date',
      'nil-pool.invalid-date.get',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.getInvalidDate(app));

    app.get('/pool-management/nil-pool/check-details',
      'nil-pool.check-details.get',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.getCheckNilPoolDetails(app));
    app.post('/pool-management/nil-pool/check-details',
      'nil-pool.check-details.post',
      auth.verify,
      controller.hasStartedNilPool(app),
      controller.postCheckNilPoolDetails(app));
  }

})();
