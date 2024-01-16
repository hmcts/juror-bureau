(function() {
  'use strict';

  var controller = require('./additional-summons.controller')
    , summonCitizenController = require('../create-pool/summon-citizens/summon-citizens.controller')
    , auth = require('../../../components/auth')
    , isBureauUser = require('../../../components/auth/user-type').isBureauUser;

  module.exports = function(app) {
    app.get('/pool-management/pool/:poolNumber/additional-summons',
      'pool.additional-summons.get',
      auth.verify,
      isBureauUser,
      controller.index(app));
    app.post('/pool-management/pool/:poolNumber/additional-summons',
      'pool.additional-summons.post',
      auth.verify,
      isBureauUser,
      controller.post(app));

    app.get('/pool-management/pool/:poolNumber/additional-summons/change-catchment-area',
      'pool.additional-summons.change-catchment-area.get',
      auth.verify,
      isBureauUser,
      summonCitizenController.getChangeCatchmentArea(app, 'summon-additional-citizens'));
    app.post('/pool-management/pool/:poolNumber/additional-summons/change-catchment-area',
      'pool.additional-summons.change-catchment-area.post',
      auth.verify,
      isBureauUser,
      summonCitizenController.postChangeCatchmentArea(app, 'summon-additional-citizens'));

    app.get('/pool-management/pool/:poolNumber/additional-summons/change-deferrals',
      'pool.additional-summons.change-deferrals.get',
      auth.verify,
      isBureauUser,
      summonCitizenController.getChangeDeferrals(app, 'summon-additional-citizens'));
    app.post('/pool-management/pool/:poolNumber/additional-summons/change-deferrals',
      'pool.additional-summons.change-deferrals.post',
      auth.verify,
      isBureauUser,
      summonCitizenController.postChangeDeferrals(app, 'summon-additional-citizens'));
  };

})();
