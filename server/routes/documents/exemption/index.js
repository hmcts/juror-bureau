const auth = require('../../../components/auth');
const exemptionTrailsController = require('./exemption-trials.controller');
const exemptionDurationController = require('./exemption-duration.controller');
const exemptionListController = require('./exemption-list.controller');

module.exports = function (app) {

  app.get('/documents/certificate-of-exemption',
    'documents.certificate-of-exemption.get',
    auth.verify,
    exemptionTrailsController.getSelectTrial(app));

  app.post('/documents/certificate-of-exemption',
    'documents.certificate-of-exemption.post',
    auth.verify,
    exemptionTrailsController.postSelectTrial(app));

  app.get('/documents/certificate-of-exemption-duration/:caseNumber',
    'documents.certificate-of-exemption-duration.get',
    auth.verify,
    exemptionDurationController.getExemptionDuration(app));

  app.post('/documents/certificate-of-exemption-duration/:caseNumber',
    'documents.certificate-of-exemption-duration.post',
    auth.verify,
    exemptionDurationController.postExemptionDuration(app));

  app.get('/documents/certificate-of-exemption-list/:caseNumber',
    'documents.certificate-of-exemption-list.get',
    auth.verify,
    exemptionListController.getExemptionList(app));

  app.get('/documents/certificate-of-exemption-list/:caseNumber/print',
    'documents.certificate-of-exemption-list.print',
    auth.verify,
    exemptionListController.printCertificateOfExemption(app));

  // ajax route for checking and unchecking jurors from the certificate of exemption list
  app.post('/documents/certificate-of-exemption-list/check',
    'documents.certificate-of-exemption-list.check.post',
    auth.verify,
    exemptionListController.checkExemptionJuror(app));
};
