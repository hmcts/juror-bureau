/* eslint-disable strict */
const controller = require('./allocation.controller');
const auth = require('../../components/auth');
const { isBureauManager } = require('../../components/auth/user-type');
const responseCountMiddleware = require('../../objects/responses').object;

module.exports = function(app) {
  app.get(
    '/new-replies',
    'allocation.get',
    auth.verify,
    isBureauManager,
    responseCountMiddleware.getCount.bind(app),
    controller.index(app)
  );

  app.post(
    '/new-replies',
    'allocation.post',
    auth.verify,
    isBureauManager,
    responseCountMiddleware.getCount.bind(app),
    controller.post(app)
  );

};
