const controller = require('./change-next-due-at-court.controller');
const auth = require('../../../../components/auth');
const { isCourtUser } = require('../../../../components/auth/user-type');

module.exports = function (app) {
  app.post('/pool-management/:poolNumber/change-next-due-at-court/',
    'pool-overview.change-next-due-at-court.post',
    auth.verify,
    isCourtUser,
    controller.postChangeNextDueAtCourt(app));

  app.get('/pool-management/:poolNumber/change-next-due-at-court/continue',
    'pool-overview.change-next-due-at-court.continue.get',
    auth.verify,
    isCourtUser,
    controller.getChangeNextDueAtCourtContinue(app));

  app.post('/pool-management/:poolNumber/change-next-due-at-court/continue',
    'pool-overview.change-next-due-at-court.continue.post',
    auth.verify,
    isCourtUser,
    controller.postChangeNextDueAtCourtContinue(app));

  app.get('/pool-management/:poolNumber/change-next-due-at-court/confirm',
    'pool-overview.change-next-due-at-court.confirm.get',
    auth.verify,
    isCourtUser,
    controller.getChangeNextDueAtCourtConfirm(app));

  app.post('/pool-management/:poolNumber/change-next-due-at-court/confirm',
    'pool-overview.change-next-due-at-court.confirm.post',
    auth.verify,
    isCourtUser,
    controller.postChangeNextDueAtCourtConfirm(app));
};
