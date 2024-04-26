/* eslint-disable strict */

const controller = require('./coroner-court.controller');
const { getSearchPools, postSearchPools } = require('./coroner-pool-search.controller');
const auth = require('../../../components/auth');
const userType = require('../../../components/auth/user-type');
const summonCitizensController = require('../create-pool/summon-citizens/summon-citizens.controller');

module.exports = function(app) {
  app.get('/pool-management/coroner-pool/select-court',
    'coroner-pool.select-court.get',
    auth.verify,
    userType.isBureauUser,
    controller.getSelectCourt(app));
  app.post('/pool-management/coroner-pool/select-court',
    'coroner-pool.select-court.post',
    auth.verify,
    userType.isBureauUser,
    controller.postSelectCourt(app));

  app.get('/pool-management/coroner-pool/pool-details',
    'coroner-pool.details.get',
    auth.verify,
    userType.isBureauUser,
    controller.getPoolDetails(app));
  app.post('/pool-management/coroner-pool/pool-details',
    'coroner-pool.details.post',
    auth.verify,
    userType.isBureauUser,
    controller.postPoolDetails(app));

  app.get('/pool-management/coroner-pool/check-details',
    'coroner-pool.check-details.get',
    auth.verify,
    userType.isBureauUser,
    controller.getCheckDetails(app));
  app.post('/pool-management/coroner-pool/check-details',
    'coroner-pool.check-details.post',
    auth.verify,
    userType.isBureauUser,
    controller.postCheckDetails(app));

  app.get('/pool-management/coroner-pool/search',
    'coroner-pool.search.get',
    auth.verify,
    getSearchPools(app));
  app.post('/pool-management/coroner-pool/search',
    'coroner-pool.search.post',
    auth.verify,
    postSearchPools(app));

  app.get('/pool-management/pool/:poolNumber/coroner/catchment-area',
    'coroner-pool.catchment-area.get',
    auth.verify,
    userType.isBureauUser,
    controller.getCatchmentArea(app));

  app.get('/pool-management/pool/:poolNumber/coroner/catchment-area/change',
    'coroner-pool.change-catchment-area.get',
    auth.verify,
    userType.isBureauUser,
    summonCitizensController.getChangeCatchmentArea(app, 'coroner-pool'));
  app.post('/pool-management/pool/:poolNumber/coroner/catchment-area/change',
    'coroner-pool.change-catchment-area.post',
    auth.verify,
    userType.isBureauUser,
    summonCitizensController.postChangeCatchmentArea(app, 'coroner-pool'));

  app.get('/pool-management/pool/:poolNumber/coroner/postcodes',
    'coroner-pool.postcodes.get',
    auth.verify,
    userType.isBureauUser,
    controller.getPostCodes(app));
  app.post('/pool-management/pool/:poolNumber/coroner/postcodes',
    'coroner-pool.postcodes.post',
    auth.verify,
    userType.isBureauUser,
    controller.postPostCodes(app));

  app.get('/pool-management/pool/:poolNumber/coroner/export',
    'coroner-pool.export.get',
    auth.verify,
    userType.isBureauUser,
    controller.getExportPool(app));
};
