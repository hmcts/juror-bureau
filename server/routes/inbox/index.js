const controller = require('./inbox.controller');
const auth = require('../../components/auth');
const responseCountMiddleware = require('../../objects/responses').object;

module.exports = function (app) {
  app.get('/inbox', 'inbox.todo.get', auth.verify, responseCountMiddleware.getCount.bind(app), controller.index(app));
};
