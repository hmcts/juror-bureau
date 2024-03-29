const controller = require('./delete-pool.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  app.get('/pool-management/delete-pool',
    'pool-management.delete-pool.get',
    auth.verify,
    controller.index(app));
  app.post('/pool-management/delete-pool',
    'pool-management.delete-pool.post',
    auth.verify,
    controller.postDeletePool(app));
};
