const controller = require('./create-record-manual.controller');
const poolController = require('../../pool-management/pool-create-manual/pool-create-manual.controller');
const auth = require('../../../components/auth');
const { isCourtUser } = require('../../../components/auth/user-type');

module.exports = function (app) {
  app.get('/juror-management/create-juror-record',
    'create-juror-record.get',
    auth.verify,
    isCourtUser,
    controller.index(app));
  app.post('/juror-management/create-juror-record',
    'create-juror-record.pool-select.post',
    auth.verify,
    isCourtUser,
    controller.postPoolSelect(app));

  app.get('/juror-management/create-juror-record/change-court',
    'create-juror-record.change-court.get',
    auth.verify,
    isCourtUser,
    controller.getChangeCourt(app));
  app.post('/juror-management/create-juror-record/change-court',
    'create-juror-record.change-court.post',
    auth.verify,
    controller.postChangeCourt(app));

  app.get('/juror-management/create-juror-record/create-pool',
    'create-juror-record.create-pool.get',
    auth.verify,
    isCourtUser,
    poolController.index(app));
  app.post('/juror-management/create-juror-record/create-pool',
    'create-juror-record.create-pool.post',
    auth.verify,
    isCourtUser,
    poolController.postPoolDetails(app));
  app.get('/juror-management/create-juror-record/create-pool/confirm',
    'create-juror-record.create-pool.confirm.get',
    auth.verify,
    isCourtUser,
    poolController.getCheckPoolDetails(app));
  app.get('/juror-management/create-juror-record/create-pool/change-court',
    'create-juror-record.create-pool.change-court.get',
    auth.verify,
    isCourtUser,
    poolController.getSelectCourt(app));
  app.post('/juror-management/create-juror-record/create-pool/change-court',
    'create-juror-record.create-pool.change-court.post',
    auth.verify,
    isCourtUser,
    poolController.postSelectCourt(app));
  app.post('/juror-management/create-juror-record/create-pool/confirm',
    'create-juror-record.create-pool.confirm.post',
    auth.verify,
    isCourtUser,
    controller.postConfirmPool(app));

  app.get('/juror-management/create-juror-record/:poolNumber/juror-name',
    'create-juror-record.juror-name.get',
    auth.verify,
    isCourtUser,
    controller.hasStarted(app),
    controller.getJurorName(app));
  app.post('/juror-management/create-juror-record/:poolNumber/juror-name',
    'create-juror-record.juror-name.post',
    auth.verify,
    isCourtUser,
    controller.postJurorName(app));

  app.get('/juror-management/create-juror-record/:poolNumber/juror-date-of-birth',
    'create-juror-record.juror-dob.get',
    auth.verify,
    controller.hasStarted(app),
    controller.getJurorDob(app));
  app.post('/juror-management/create-juror-record/:poolNumber/juror-date-of-birth',
    'create-juror-record.juror-dob.post',
    auth.verify,
    isCourtUser,
    controller.postJurorDob(app));

  app.get('/juror-management/create-juror-record/:poolNumber/ineligible-age',
    'create-juror-record.ineligible-age.get',
    auth.verify,
    isCourtUser,
    controller.hasStarted(app),
    controller.getIneligibleAge(app));
  app.post('/juror-management/create-juror-record/:poolNumber/ineligible-age',
    'create-juror-record.ineligible-age.post',
    auth.verify,
    controller.postIneligibleAge(app));

  app.get('/juror-management/create-juror-record/:poolNumber/juror-address',
    'create-juror-record.juror-address.get',
    auth.verify,
    controller.hasStarted(app),
    controller.getJurorAddress(app));
  app.post('/juror-management/create-juror-record/:poolNumber/juror-address',
    'create-juror-record.juror-address.post',
    auth.verify,
    isCourtUser,
    controller.postJurorAddress(app));

  app.get('/juror-management/create-juror-record/:poolNumber/outside-catchment-area',
    'create-juror-record.outside-postcode.get',
    auth.verify,
    controller.hasStarted(app),
    controller.getOutsidePostcode(app));

  app.get('/juror-management/create-juror-record/:poolNumber/juror-contact',
    'create-juror-record.juror-contact.get',
    auth.verify,
    controller.hasStarted(app),
    controller.getContact(app));
  app.post('/juror-management/create-juror-record/:poolNumber/juror-contact',
    'create-juror-record.juror-contact.post',
    auth.verify,
    isCourtUser,
    controller.postContact(app));

  app.get('/juror-management/create-juror-record/:poolNumber/notes',
    'create-juror-record.notes.get',
    auth.verify,
    isCourtUser,
    controller.hasStarted(app),
    controller.getNotes(app));
  app.post('/juror-management/create-juror-record/:poolNumber/notes',
    'create-juror-record.notes.post',
    auth.verify,
    isCourtUser,
    controller.postNotes(app));

  app.get('/juror-management/create-juror-record/:poolNumber/summary',
    'create-juror-record.summary.get',
    auth.verify,
    isCourtUser,
    controller.hasStarted(app),
    controller.getSummary(app));
  app.post('/juror-management/create-juror-record/:poolNumber/summary',
    'create-juror-record.summary.post',
    auth.verify,
    isCourtUser,
    controller.postSummary(app));
};
