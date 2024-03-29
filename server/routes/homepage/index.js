const controller = require('./homepage.controller');
const auth = require('../../components/auth');

module.exports = function (app) {
  app.get('/homepage', 'homepage.get', auth.verify, controller.homepage(app));
};
