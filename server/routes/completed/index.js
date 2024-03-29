const controller = require('./completed.controller');
const auth = require('../../components/auth');
const responseCountMiddleware = require('../../objects/responses').object;


module.exports = function (app) {
  app.get(
    '/completed',
    'inbox.completed.get',
    auth.verify,
    responseCountMiddleware.getCount.bind(app),
    controller.index(app),
  );
};

