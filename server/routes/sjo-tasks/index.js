(function() {
  'use strict';

  const controller = require('./sjo-tasks.controller');
  const auth = require('../../components/auth');

  module.exports = function(app) {

    app.get('/senior-jury-officer-tasks/uncomplete-service/',
      'sjo-tasks.uncomplete-service.get',
      auth.verify,
      auth.isSJO,
      controller.getUncompleteService(app),
    );
    app.post('/senior-jury-officer-tasks/uncomplete-service/',
      'sjo-tasks.uncomplete-service.post',
      auth.verify,
      auth.isSJO,
      controller.postUncompleteService(app),
    );

    app.get('/senior-jury-officer-tasks/uncomplete-service/search',
      'sjo-tasks.uncomplete-service.select.get',
      auth.verify,
      auth.isSJO,
      controller.getSelectUncomplete(app),
    );
    app.post('/senior-jury-officer-tasks/uncomplete-service/search',
      'sjo-tasks.uncomplete-service.select.post',
      auth.verify,
      auth.isSJO,
      controller.postSelectUncomplete(app),
    );

    app.post('/senior-jury-officer-tasks/uncomplete-service/search/check',
      'sjo-tasks.uncomplete-service.check-uncheck.post',
      auth.verify,
      controller.postCheckJuror(app));

    app.get('/senior-jury-officer-tasks/uncomplete-service/confirm',
      'sjo-tasks.uncomplete-service.confirm.get',
      auth.verify,
      auth.isSJO,
      controller.getConfirmUncomplete(app),
    );
    app.post('/senior-jury-officer-tasks/uncomplete-service/confirm',
      'sjo-tasks.uncomplete-service.confirm.post',
      auth.verify,
      auth.isSJO,
      controller.postConfirmUncomplete(app),
    );

  };

})();
