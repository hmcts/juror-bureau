(function() {
  'use strict';

  const controller = require('./failed-to-attend.controller');
  const auth = require('../../../components/auth');

  module.exports = function(app) {

    app.get('/documents/during-service/failed-to-attend',
      'documents.failed-to-attend.get',
      auth.verify,
      controller.getFailedToAttend(app));

    app.get('/documents/during-service/juror-failed-to-attend',
      'printing.failed-to-attend.get',
      auth.verify,
      controller.getSingleFailedToAttend(app));
  };

})();
