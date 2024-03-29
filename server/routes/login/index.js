const controller = require('./login.controller');

module.exports = function (app) {
  app.get('/', 'login.get', controller.index(app));
  app.post('/', 'login.post', controller.create(app));
};
