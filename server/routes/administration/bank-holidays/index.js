const auth = require('../../../components/auth');
const controller = require('./bank-holidays.controller');
const { isSystemAdministrator } = require('../../../components/auth/user-type');

module.exports = function (app) {
  app.get('/administration/bank-holidays',
    'administration.bank-holidays.get',
    auth.verify,
    isSystemAdministrator,
    controller.getBankHolidays(app),
  );
};
