const controller = require('./convert-nil-pool.controller');
const auth = require('../../../components/auth');
const { isBureauUser } = require('../../../components/auth/user-type');

module.exports = function (app) {
  app.get('/pool-management/nil-pool/:poolNumber/convert',
    'nil-pool.convert.form.get',
    auth.verify,
    isBureauUser,
    controller.index(app));
  app.post('/pool-management/nil-pool/:poolNumber/convert',
    'nil-pool.convert.form.post',
    auth.verify,
    isBureauUser,
    controller.post(app));

  app.get('/pool-management/nil-pool/:poolNumber/convert/change-deferrals',
    'nil-pool.convert.change-deferrals.get',
    auth.verify,
    isBureauUser,
    controller.getChangeCourtDeferrals(app));
  app.post('/pool-management/nil-pool/:poolNumber/convert/change-deferrals',
    'nil-pool.convert.change-deferrals.post',
    auth.verify,
    isBureauUser,
    controller.postChangeCourtDeferrals(app));

  app.get('/pool-management/nil-pool/:poolNumber/convert/check-details',
    'nil-pool.convert.check-details.get',
    auth.verify,
    isBureauUser,
    controller.getCheckDetails(app));
  app.post('/pool-management/nil-pool/:poolNumber/convert/check-details',
    'nil-pool.convert.check-details.post',
    auth.verify,
    isBureauUser,
    controller.postCheckDetails(app));
};
