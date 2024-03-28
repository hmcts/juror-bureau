const { isCourtManager } = require('../../../components/auth/user-type');

(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./judges.controller');

  module.exports = function(app) {

    app.get('/administration/judges',
      'administration.judges.get',
      auth.verify,
      isCourtManager,
      controller.getJudges(app),
    );

    app.get('/administration/judges/:judgeId/edit',
      'administration.judges.edit.get',
      auth.verify,
      isCourtManager,
      controller.getEditJudge(app),
    );

    app.post('/administration/judges/:judgeId/edit',
      'administration.judges.edit.post',
      auth.verify,
      isCourtManager,
      controller.postEditJudge(app),
    );

    app.get('/administration/judges/:judgeId/delete',
      'administration.judges.delete.get',
      auth.verify,
      isCourtManager,
      controller.getDeleteJudge(app),
    );

    app.post('/administration/judges/:judgeId/delete',
      'administration.judges.delete.post',
      auth.verify,
      isCourtManager,
      controller.postDeleteJudge(app),
    );

    app.get('/administration/judges/add',
      'administration.judges.add.get',
      auth.verify,
      isCourtManager,
      controller.getAddJudge(app),
    );

    app.post('/administration/judges/add',
      'administration.judges.add.post',
      auth.verify,
      isCourtManager,
      controller.postAddJudge(app),
    );

  };
})();
