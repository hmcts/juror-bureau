(function(){
  'use strict';

  const controller = require('./bureau-create-juror-record.controller');
  const createController = require('../../juror-management/create-record-manual/create-record-manual.controller');
  const auth = require('../../../components/auth');
  const { canCreateNewJuror } = require('../../../components/auth/user-type');

  module.exports = function(app) {
    app.get('/pool-management/create-juror-record/:poolNumber',
      'bureau-create-juror-record.get',
      auth.verify,
      canCreateNewJuror,
      controller.index(app));
    app.get('/pool-management/create-juror-record/:poolNumber/juror-name',
      'bureau-create-juror-record.juror-name.get',
      auth.verify,
      canCreateNewJuror,
      createController.hasStarted(app),
      createController.getJurorName(app));
    app.post('/pool-management/create-juror-record/:poolNumber/juror-name',
      'bureau-create-juror-record.juror-name.post',
      auth.verify,
      canCreateNewJuror,
      createController.postJurorName(app));

    app.get('/pool-management/create-juror-record/:poolNumber/juror-date-of-birth',
      'bureau-create-juror-record.juror-dob.get',
      auth.verify,
      createController.hasStarted(app),
      createController.getJurorDob(app));
    app.post('/pool-management/create-juror-record/:poolNumber/juror-date-of-birth',
      'bureau-create-juror-record.juror-dob.post',
      auth.verify,
      canCreateNewJuror,
      createController.postJurorDob(app));

    app.get('/pool-management/create-juror-record/:poolNumber/ineligible-age',
      'bureau-create-juror-record.ineligible-age.get',
      auth.verify,
      canCreateNewJuror,
      createController.hasStarted(app),
      createController.getIneligibleAge(app));
    app.post('/pool-management/create-juror-record/:poolNumber/ineligible-age',
      'bureau-create-juror-record.ineligible-age.post',
      auth.verify,
      createController.postIneligibleAge(app));

    app.get('/pool-management/create-juror-record/:poolNumber/juror-address',
      'bureau-create-juror-record.juror-address.get',
      auth.verify,
      createController.hasStarted(app),
      createController.getJurorAddress(app));
    app.post('/pool-management/create-juror-record/:poolNumber/juror-address',
      'bureau-create-juror-record.juror-address.post',
      auth.verify,
      canCreateNewJuror,
      createController.postJurorAddress(app));

    app.get('/pool-management/create-juror-record/:poolNumber/outside-catchment-area',
      'bureau-create-juror-record.outside-postcode.get',
      auth.verify,
      createController.hasStarted(app),
      createController.getOutsidePostcode(app));

    app.get('/pool-management/create-juror-record/:poolNumber/juror-contact',
      'bureau-create-juror-record.juror-contact.get',
      auth.verify,
      createController.hasStarted(app),
      createController.getContact(app));
    app.post('/pool-management/create-juror-record/:poolNumber/juror-contact',
      'bureau-create-juror-record.juror-contact.post',
      auth.verify,
      canCreateNewJuror,
      createController.postContact(app));

    app.get('/pool-management/create-juror-record/:poolNumber/notes',
      'bureau-create-juror-record.notes.get',
      auth.verify,
      canCreateNewJuror,
      createController.hasStarted(app),
      createController.getNotes(app));
    app.post('/pool-management/create-juror-record/:poolNumber/notes',
      'bureau-create-juror-record.notes.post',
      auth.verify,
      canCreateNewJuror,
      createController.postNotes(app));

    app.get('/pool-management/create-juror-record/:poolNumber/summary',
      'bureau-create-juror-record.summary.get',
      auth.verify,
      canCreateNewJuror,
      createController.hasStarted(app),
      createController.getSummary(app));
    app.post('/pool-management/create-juror-record/:poolNumber/summary',
      'bureau-create-juror-record.summary.post',
      auth.verify,
      canCreateNewJuror,
      createController.postSummary(app));
  };

})();
