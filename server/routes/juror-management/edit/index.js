(function() {
  'use strict';

  var controller = require('./juror-edit.controller')
    , auth = require('../../../components/auth/');

  module.exports = function(app) {

    app.get('/juror-management/record/:jurorNumber/details/edit',
      'juror-record.details-edit.get',
      auth.verify,
      controller.getEditDetails(app));
    app.post('/juror-management/record/:jurorNumber/details/edit',
      'juror-record.details-edit.post',
      auth.verify,
      controller.postEditDetails(app));
    app.get('/juror-management/record/:jurorNumber/details/edit/address',
      'juror-record.details-edit-address.get',
      auth.verify,
      controller.getEditDetailsAddress(app));
    app.post('/juror-management/record/:jurorNumber/details/edit/address',
      'juror-record.details-edit-address.post',
      auth.verify,
      controller.postEditDetailsAddress(app));

    app.get('/juror-management/record/:jurorNumber/deferral/edit',
      'juror-record.deferral-edit.get',
      auth.verify,
      controller.getEditDeferral(app));
    app.post('/juror-management/record/:jurorNumber/deferral/edit',
      'juror-record.deferral-edit.post',
      auth.verify,
      controller.postEditDeferral(app));

    app.post('/juror-management/record/:jurorNumber/deferral/edit/delete',
      'juror-record.deferral-edit-delete.post',
      auth.verify,
      controller.postDeleteDeferral(app));

    app.get('/juror-management/record/:jurorNumber/deferral/edit/confirm',
      'juror-record.deferral-edit-confirm.get',
      auth.verify,
      controller.getEditDeferralConfirm(app));
    app.post('/juror-management/record/:jurorNumber/deferral/edit/confirm',
      'juror-record.deferral-edit-confirm.post',
      auth.verify,
      controller.postEditDeferralConfirm(app));

    app.get('/juror-management/record/:jurorNumber/details/edit-name',
      'juror-record.details-edit.name.get',
      auth.verify,
      controller.getEditName(app));
    app.post('/juror-management/record/:jurorNumber/details/edit-name',
      'juror-record.details-edit.name.post',
      auth.verify,
      controller.postEditName(app));

    app.get('/juror-management/record/:jurorNumber/details/ineligible-age',
      'juror-record.details-edit.ineligible-age.get',
      auth.verify,
      controller.getIneligibleAge(app));
    app.post('/juror-management/record/:jurorNumber/details/ineligible-age',
      'juror-record.details-edit.ineligible-age.post',
      auth.verify,
      controller.postIneligibleAge(app));
  };
})();
