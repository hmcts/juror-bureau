const auth = require('../../../components/auth');
const controller = require('./non-sitting-days.controller');

module.exports = function (app) {

  app.post('/administration/-non-sitting-days',
    'administration.non-sitting-days.post',
    auth.verify,
    controller.postNonSittingDays(app),
  );

  app.get('/administration/non-sitting-days',
    'administration.non-sitting-days.get',
    auth.verify,
    controller.getNonSittingDays(app),
  );
  app.get('/administration/add-non-sitting-days',
    'administration.add-non-sitting-days.get',
    auth.verify,
    controller.getAddNonSittingDay(app),
  );
  app.post('/administration/add-non-sitting-days',
    'administration.add-non-sitting-days.post',
    auth.verify,
    controller.postAddNonSittingDay(app),
  );
  app.get('/administration/delete-non-sitting-days',
    'administration.delete-non-sitting-days.get',
    auth.verify,
    controller.deleteNonSittingDay(app),
  );
  app.post('/administration/delete-non-sitting-days',
    'administration.delete-non-sitting-days.post',
    auth.verify,
    controller.postDeleteNonSittingDay(app),
  );

};
