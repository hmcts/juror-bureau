const controller = require('./new-name.controller');
const auth = require('../../../components/auth');
const { isCourtUser } = require('../../../components/auth/user-type');

module.exports = function (app) {
  app.get('/juror-management/record/:jurorNumber/details/new-name',
    'juror-record.details.new-name.get',
    auth.verify,
    isCourtUser,
    controller.getNewName(app),
  );
  app.post('/juror-management/record/:jurorNumber/details/new-name',
    'juror-record.details.new-name.post',
    auth.verify,
    isCourtUser,
    controller.postNewName(app),
  );

  app.get('/juror-management/record/:jurorNumber/details/new-name/reject',
    'juror-record.details.new-name.reject.get',
    auth.verify,
    isCourtUser,
    controller.getRejectName(app),
  );
  app.post('/juror-management/record/:jurorNumber/details/new-name/reject',
    'juror-record.details.new-name.reject.post',
    auth.verify,
    isCourtUser,
    controller.postRejectName(app),
  );
};
