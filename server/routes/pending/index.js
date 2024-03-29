const controller = require('./pending.controller');
const auth = require('../../components/auth');
const responseCountMiddleware = require('../../objects/responses').object;

module.exports = function (app) {
  app.get('/pending',
    'inbox.pending.get',
    auth.verify,
    responseCountMiddleware.getCount.bind(app),
    controller.index(app));
};
