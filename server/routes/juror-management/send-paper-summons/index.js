(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./send-paper-summons.controller');
  const jurorUpdateController = require('../update/juror-update.controller');
  const config = require('../../../config/environment')();

  module.exports = function(app) {
    if (config.featureFlags.digitalByDefault) {
      app.get('/juror-management/juror/:jurorNumber/send-paper-summons',
        'juror-management.send-paper-summons.get',
        auth.verify,
        controller.getSendPaperSummons(app));
      app.post('/juror-management/juror/:jurorNumber/send-paper-summons',
        'juror-management.send-paper-summons.post',
        auth.verify,
        controller.postSendPaperSummons(app));
    }
  };
  
})();