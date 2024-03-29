const controller = require('./search.controller');
const auth = require('../../components/auth');
// , responseCountMiddleware = require('../../objects/responses').object;

module.exports = function (app) {
  app.get('/search',
    'search.get',
    auth.verify,
    // responseCountMiddleware.getCount.bind(app),
    controller.index(app));
  app.get('/search/clear',
    'search.clear.get',
    auth.verify,
    // responseCountMiddleware.getCount.bind(app),
    controller.searchClear(app));
  app.post('/search',
    'search.post',
    auth.verify,
    // responseCountMiddleware.getCount.bind(app),
    controller.search(app));
};
