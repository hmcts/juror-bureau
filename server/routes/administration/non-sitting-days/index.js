(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./non-sitting-days.controller');
  const { isCourtUser } = require('../../../components/auth/user-type');

  module.exports = function(app) {

    app.post('/administration/non-sitting-days',
      'administration.non-sitting-days.post',
      auth.verify,
      isCourtUser,
      controller.postNonSittingDays(app),
    );

    app.get('/administration/non-sitting-days',
      'administration.non-sitting-days.get',
      auth.verify,
      isCourtUser,
      controller.getNonSittingDays(app),
    );
    app.get('/administration/add-non-sitting-days',
      'administration.add-non-sitting-days.get',
      auth.verify,
      isCourtUser,
      controller.getAddNonSittingDay(app),
    );
    app.post('/administration/add-non-sitting-days',
      'administration.add-non-sitting-days.post',
      auth.verify,
      isCourtUser,
      controller.postAddNonSittingDay(app),
    );
    app.get('/administration/delete-non-sitting-days',
      'administration.delete-non-sitting-days.get',
      auth.verify,
      isCourtUser,
      controller.deleteNonSittingDay(app),
    );
    app.post('/administration/delete-non-sitting-days',
      'administration.delete-non-sitting-days.post',
      auth.verify,
      isCourtUser,
      controller.postDeleteNonSittingDay(app),
    );

  };
})();
