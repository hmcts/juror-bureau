/* eslint-disable strict */

const controller = require('./confirm-identity.controller');
const auth = require('../../../../components/auth');
const { isCourtUser } = require('../../../../components/auth/user-type');

module.exports = function(app) {

  app.get('/juror-management/record/:jurorNumber/confirm-identity',
    'juror-record.confirm-identity.get',
    auth.verify,
    isCourtUser,
    controller.getConfirmIdentity(app),
  );

  app.post('/juror-management/record/:jurorNumber/confirm-identity',
    'juror-record.confirm-identity.post',
    auth.verify,
    isCourtUser,
    controller.postConfirmIdentity(app),
  );

};
