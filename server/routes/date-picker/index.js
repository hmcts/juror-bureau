(function() {
  'use strict';

  const auth = require('../../components/auth');
  const controller = require('./date-picker.controller');

  module.exports = function(app) {
    app.get('/date-picker/bank-holidays',
      'administration.bank-holidays.get',
      auth.verify,
      controller.getBankHolidays(app),
    );
  };
})();
