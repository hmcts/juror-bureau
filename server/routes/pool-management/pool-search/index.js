const controller = require('./pool-search.controller');
const auth = require('../../../components/auth');

module.exports = function (app) {
  app.get('/pool-management/search', 'pool-search.get', auth.verify, controller.index(app));
  app.post('/pool-management/search', 'pool-search.post', auth.verify, controller.post(app));
};
