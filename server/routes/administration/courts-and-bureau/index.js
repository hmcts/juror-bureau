const auth = require('../../../components/auth');
const { isSystemAdministrator } = require('../../../components/auth/user-type');
const controller = require('./courts-and-bureau.controller');

module.exports = function (app) {

  app.get('/administration/courts-and-bureau/',
    'administration.courts-and-bureau.get',
    auth.verify,
    isSystemAdministrator,
    controller.getCourtsAndBureau(app),
  );

  app.post('/administration/courts-and-bureau/filter',
    'administration.courts-and-bureau.filter',
    auth.verify,
    isSystemAdministrator,
    controller.postFilterCourts(app),
  );
};
