const auth = require('../../../components/auth');
const { isBureauUser } = require('../../../components/auth/user-type');
const controller = require('./bulk-undeliverable.controller');

module.exports = (app) => {
  app.get('/summons-management/bulk-undeliverable',
    'summons-management.bulk-undeliverable.get',
    auth.verify,
    isBureauUser,
    controller.getBulkUndeliverable(app),
  );

  app.post('/summons-management/bulk-undeliverable',
    'summons-management.bulk-undeliverable.post',
    auth.verify,
    isBureauUser,
    controller.postBulkUndeliverable(app),
  );

  app.post('/summons-management/bulk-undeliverable/find-juror',
    'summons-management.bulk-undeliverable.find-juror.post',
    auth.verify,
    isBureauUser,
    controller.postFindJuror(app),
  );
};
