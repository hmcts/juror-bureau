const auth = require('../../../components/auth');
const controller = require('./system-codes.controller');

module.exports = function (app) {

  app.get('/administration/system-codes',
    'administration.system-codes.get',
    auth.verify,
    controller.getSystemCodesList(app),
  );

  app.get('/administration/system-codes/:codeType',
    'administration.system-codes.codes.get',
    auth.verify,
    controller.getViewCodes(app),
  );

};
