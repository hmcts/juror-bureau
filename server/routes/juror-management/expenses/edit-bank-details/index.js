(function() {
  'use strict';

  const auth = require('../../../../components/auth');
  const controller = require('./edit-bank-details.controller');
  const jurorRecordController = require('../../juror-record/juror-record.controller');
  const editJurorController = require('../../edit/juror-edit.controller');

  module.exports = function(app) {

    app.get('/juror-management/expenses/:jurorNumber/:locCode/bank-details',
      'juror-management.bank-details.get',
      auth.verify,
      controller.getBankDetails(app));

    app.post('/juror-management/expenses/:jurorNumber/:locCode/bank-details',
      'juror-management.bank-details.post',
      auth.verify,
      controller.postBankDetails(app));

    // EDITING NOTES ROUTES
    app.get('/juror-management/expenses/:jurorNumber/:locCode/bank-details/notes/edit',
      'juror-management.bank-details.notes-edit.get',
      auth.verify,
      jurorRecordController.getEditNotes(app));

    app.post('/juror-management/expenses/:jurorNumber/:locCode/bank-details/notes/edit',
      'juror-management.bank-details.notes-edit.post',
      auth.verify,
      jurorRecordController.postEditNotes(app));

    // EDITING ADDRESS ROUTES
    app.get('/juror-management/expenses/:jurorNumber/:locCode/bank-details/address',
      'juror-management.bank-details.address.get',
      auth.verify,
      editJurorController.getEditDetails(app));

    app.get('/juror-management/expenses/:jurorNumber/:locCode/bank-details/address/edit',
      'juror-management.bank-details.address-edit.get',
      auth.verify,
      editJurorController.getEditDetailsAddress(app));

    app.post('/juror-management/expenses/:jurorNumber/:locCode/bank-details/address/edit',
      'juror-management.bank-details.address-edit.post',
      auth.verify,
      editJurorController.postEditDetailsAddress(app));



    //ROUTES FROM JUROR RECORD BANK DETIALS CHANGE

    app.get('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details',
      'juror-record.bank-details.get',
      auth.verify,
      controller.getBankDetails(app));

    app.post('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details',
      'juror-record.bank-details.post',
      auth.verify,
      controller.postBankDetails(app));

    // EDITING NOTES ROUTES
    app.get('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details/notes/edit',
      'juror-record.bank-details.notes-edit.get',
      auth.verify,
      jurorRecordController.getEditNotes(app));

    app.post('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details/notes/edit',
      'juror-record.bank-details.notes-edit.post',
      auth.verify,
      jurorRecordController.postEditNotes(app));

    // EDITING ADDRESS ROUTES
    app.get('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details/address',
      'juror-record.bank-details.address.get',
      auth.verify,
      editJurorController.getEditDetails(app));

    app.get('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details/address/edit',
      'juror-record.bank-details.address-edit.get',
      auth.verify,
      editJurorController.getEditDetailsAddress(app));

    app.post('/juror-management/record/:jurorNumber/:poolNumber/expenses/bank-details/address/edit',
      'juror-record.bank-details.address-edit.post',
      auth.verify,
      editJurorController.postEditDetailsAddress(app));

  };

})();
