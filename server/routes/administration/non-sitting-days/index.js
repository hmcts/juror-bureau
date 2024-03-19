(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./non-sitting-days.controller');

  module.exports = function(app) {

    app.get('/administration/non-sitting-days',
      'administration.non-sitting-days.get',
      auth.verify,
      controller.getNonSittingDays(app),
    );


  };
})();
