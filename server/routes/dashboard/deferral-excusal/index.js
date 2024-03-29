const controller = require('./deferral-excusal.controller');

module.exports = function (app) {
  app.get('/dashboard/deferral-excusal', 'dashboard.deferral-excusal.get', controller.index(app));
  app.post('/dashboard/deferral-excusal', 'dashboard.deferral-excusal.post', controller.getData(app));
};
