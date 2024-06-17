(function() {
  'use strict';

  const controller = require('./sjo-tasks.controller');
  const uncompleteServiceController = require('./uncomplete-service.controller');
  const undoFailedToAttendController = require('./undo-failed-to-attend.controller');
  const auth = require('../../components/auth');

  module.exports = function(app) {

    // generic controllers
    app.get('/senior-jury-officer-tasks/uncomplete-service',
      'sjo-tasks.uncomplete-service.get',
      auth.verify,
      auth.isSJO,
      controller.getSJOTasksSearch(app, {
        nav: 'uncomplete',
        title: 'Uncomplete service',
        searchLabel: 'Search for completed jurors by',
        postRoute: 'sjo-tasks.uncomplete-service.post',
        cancelRoute: 'sjo-tasks.uncomplete-service.get',
      }),
    );
    app.post('/senior-jury-officer-tasks/uncomplete-service',
      'sjo-tasks.uncomplete-service.post',
      auth.verify,
      auth.isSJO,
      controller.postSJOTasksSearch(app, {
        continueRoute: 'sjo-tasks.uncomplete-service.select.get',
        redirectBackRoute: 'sjo-tasks.uncomplete-service.get',
      }),
    );

    app.get('/senior-jury-officer-tasks/undo-failed-to-attend',
      'sjo-tasks.undo-failed-to-attend.get',
      auth.verify,
      auth.isSJO,
      controller.getSJOTasksSearch(app, {
        nav: 'undoFTA',
        title: 'Undo failed to attend',
        searchLabel: 'Search for jurors by',
        postRoute: 'sjo-tasks.undo-failed-to-attend.post',
        cancelRoute: 'sjo-tasks.undo-failed-to-attend.get',
      }),
    );
    app.post('/senior-jury-officer-tasks/undo-failed-to-attend',
      'sjo-tasks.undo-failed-to-attend.post',
      auth.verify,
      auth.isSJO,
      controller.postSJOTasksSearch(app, {
        continueRoute: 'sjo-tasks.undo-failed-to-attend.select.get',
        redirectBackRoute: 'sjo-tasks.undo-failed-to-attend.get',
      }),
    );

    app.get('/senior-jury-officer-tasks/uncomplete-service/search',
      'sjo-tasks.uncomplete-service.select.get',
      auth.verify,
      auth.isSJO,
      controller.getSearchResults(app, {
        title: 'Uncomplete service',
        task: 'uncomplete-service',
        backLinkRoute: 'sjo-tasks.uncomplete-service.get',
        postRoute: 'sjo-tasks.uncomplete-service.search.post',
      }),
    );

    app.get('/senior-jury-officer-tasks/undo-failed-to-attend/search',
      'sjo-tasks.undo-failed-to-attend.select.get',
      auth.verify,
      auth.isSJO,
      controller.getSearchResults(app, {
        title: 'Undo failed to attend',
        task: 'undo-failed-to-attend',
        backLinkRoute: 'sjo-tasks.undo-failed-to-attend.get',
        postRoute: 'sjo-tasks.undo-failed-to-attend.search.post',
      }),
    );

    app.post('/senior-jury-officer-tasks/uncomplete-service/search/check',
      'sjo-tasks.uncomplete-service.check-uncheck.post',
      auth.verify,
      controller.postCheckJuror(app),
    );


    // uncomplete service
    app.post('/senior-jury-officer-tasks/uncomplete-service/search',
      'sjo-tasks.uncomplete-service.search.post',
      auth.verify,
      auth.isSJO,
      uncompleteServiceController.postSelectUncomplete(app),
    );

    app.get('/senior-jury-officer-tasks/uncomplete-service/confirm',
      'sjo-tasks.uncomplete-service.confirm.get',
      auth.verify,
      auth.isSJO,
      uncompleteServiceController.getConfirmUncomplete(app),
    );

    app.post('/senior-jury-officer-tasks/uncomplete-service/confirm',
      'sjo-tasks.uncomplete-service.confirm.post',
      auth.verify,
      auth.isSJO,
      uncompleteServiceController.postConfirmUncomplete(app),
    );


    // undo failed to attend
    app.post('/senior-jury-officer-tasks/undo-failed-to-attend/search',
      'sjo-tasks.undo-failed-to-attend.search.post',
      auth.verify,
      auth.isSJO,
      undoFailedToAttendController.postSelectUndoFailedToAttend(app),
    );

    app.get('/senior-jury-officer-tasks/undo-failed-to-attend/confirm',
      'sjo-tasks.undo-failed-to-attend.confirm.get',
      auth.verify,
      auth.isSJO,
      undoFailedToAttendController.getConfirmUndoFailedToAttend(app),
    );

    app.post('/senior-jury-officer-tasks/undo-failed-to-attend/confirm',
      'sjo-tasks.undo-failed-to-attend.confirm.post',
      auth.verify,
      auth.isSJO,
      undoFailedToAttendController.postConfirmUndoFailedToAttend(app),
    );
  };

})();
