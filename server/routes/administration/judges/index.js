const { isCourtUser } = require('../../../components/auth/user-type');

(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const controller = require('./judges.controller');

  module.exports = function(app) {

    app.get('/administration/judges',
      'administration.judges.get',
      auth.verify,
      isCourtUser,
      controller.getJudges(app),
    );

    app.get('/administration/judges/:judgeId/edit',
      'administration.judges.edit.get',
      auth.verify,
      isCourtUser,
      controller.getEditJudge(app),
    );

    app.post('/administration/judges/:judgeId/edit',
      'administration.judges.edit.post',
      auth.verify,
      isCourtUser,
      controller.postEditJudge(app),
    );

    app.get('/administration/judges/:judgeId/delete',
      'administration.judges.delete.get',
      auth.verify,
      isCourtUser,
      controller.getDeleteJudge(app),
    );

    app.post('/administration/judges/:judgeId/delete',
      'administration.judges.delete.post',
      auth.verify,
      isCourtUser,
      controller.postDeleteJudge(app),
    );

    app.get('/administration/judges/add',
      'administration.judges.add.get',
      auth.verify,
      isCourtUser,
      controller.getAddJudge(app),
    );

    app.post('/administration/judges/add',
      'administration.judges.add.post',
      auth.verify,
      isCourtUser,
      controller.postAddJudge(app),
    );

  };
})();
