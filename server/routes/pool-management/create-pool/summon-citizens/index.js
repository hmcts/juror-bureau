const controller = require('./summon-citizens.controller');
const auth = require('../../../../components/auth');
const isBureauUser = require('../../../../components/auth/user-type').isBureauUser;

module.exports = function (app) {
  app.get('/pool-management/pool-overview/:poolNumber/summon-citizens'
    , 'summon-citizens.get'
    , auth.verify
    , isBureauUser
    , controller.index(app));

  app.post('/pool-management/pool-overview/:poolNumber/summon-citizens'
    , 'summon-citizens.post'
    , auth.verify
    , isBureauUser
    , controller.post(app));

  app.get('/pool-management/pool-overview/:poolNumber/summon-citizens/change-catchment-area'
    , 'summon-citizens.change-catchment-area.get'
    , auth.verify
    , isBureauUser
    , controller.getChangeCatchmentArea(app, 'summon-citizens'));
  app.post('/pool-management/pool-overview/:poolNumber/summon-citizens/change-catchment-area'
    , 'summon-citizens.change-catchment-area.post'
    , auth.verify
    , isBureauUser
    , controller.postChangeCatchmentArea(app, 'summon-citizens'));

  app.get('/pool-management/pool/:poolNumber/summon-citizens/change-deferrals',
    'summon-citizens.change-deferrals.get',
    auth.verify,
    isBureauUser,
    controller.getChangeDeferrals(app, 'summon-citizens'));
  app.post('/pool-management/pool/:poolNumber/summon-citizens/change-deferrals',
    'summon-citizens.change-deferrals.post',
    auth.verify,
    isBureauUser,
    controller.postChangeDeferrals(app, 'summon-citizens'));
};
