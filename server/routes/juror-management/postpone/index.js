const auth = require('../../../components/auth');
const controller = require('./postpone.controller');

module.exports = function (app) {
  app.get('/juror-management/juror/:jurorNumber/update/postpone-date',
    'juror.update.postpone-date.get',
    auth.verify,
    controller.getPostponeDate(app));
  app.post('/juror-management/juror/:jurorNumber/update/postpone-date',
    'juror.update.postpone-date.post',
    auth.verify,
    controller.postPostponeDate(app));

  app.get('/juror-management/juror/:jurorNumber/update/postpone/letter',
    'juror-update.postpone.letter.get',
    auth.verify,
    controller.getPostponeLetter(app));
  app.post('/juror-management/juror/:jurorNumber/update/postpone/letter',
    'juror-update.postpone.letter.post',
    auth.verify,
    controller.postPostponeLetter(app));

  app.post('/juror-management/pool/:poolNumber/update/postpone-date',
    'juror.update.bulk-postpone-date.post',
    auth.verify,
    controller.postPostponeDate(app));
  app.post('/juror-management/pool/:poolNumber/postpone-continue',
    'juror.update-bulk-postpone.continue.post',
    auth.verify,
    controller.postMovementCheck(app));

  app.get('/juror-management/juror/:jurorNumber/available-pools',
    'juror.update.available-pools.get',
    auth.verify,
    controller.getAvailablePools(app));
  app.post('/juror-management/juror/:jurorNumber/available-pools',
    'juror.update.available-pools.post',
    auth.verify,
    controller.postAvailablePools(app));

  app.get('/juror-management/pool/:poolNumber/available-pools',
    'juror.update-bulk-postpone.available-pools.get',
    auth.verify,
    controller.getAvailablePools(app));
  app.post('/juror-management/pool/:poolNumber/available-pools',
    'juror.update-bulk-postpone.available-pools.post',
    auth.verify,
    controller.postAvailablePools(app));

  app.get('/juror-management/pool/:poolNumber/postpone/movecheck',
    'juror.update-bulk-postpone.movement-check.get',
    auth.verify,
    controller.getMovementCheck(app));
};
