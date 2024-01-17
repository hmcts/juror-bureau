(function() {
  'use strict';

  const auth = require('../../../components/auth');
  const jurorDetails = require('./juror-details.controller');
  const eligibility = require('./eligibility.controller');
  const replyType = require('./reply-type.controller');
  const cjsEmployment = require('./cjs-employment.controller');
  const reasonableAdjustments = require('./reasonable-adjustments.controller');
  const signature = require('./signature.controller');

  module.exports = function(app) {
    const urlPaperPrefix = '/summons-replies/response/:id/:type/update';
    const urlDigitalPrefix = '/response/:id/:type/update';

    app.get(`${urlPaperPrefix}/details`,
      'summons.update-details.get',
      auth.verify,
      jurorDetails.getPaper(app));
    app.get(`${urlDigitalPrefix}/details`,
      'summons.update-details-digital.get',
      auth.verify,
      jurorDetails.getDigital(app));
    app.post(`${urlPaperPrefix}/details`,
      'summons.update-details.post',
      auth.verify,
      jurorDetails.post(app));

    app.get(`${urlPaperPrefix}/age-check`,
      'summons.update-age.get',
      auth.verify,
      jurorDetails.getIneligibleAge(app));
    app.get(`${urlDigitalPrefix}/age-check`,
      'summons.update-age-digital.get',
      auth.verify,
      jurorDetails.getIneligibleAge(app));

    app.post(`${urlPaperPrefix}/age-check`,
      'summons.update-age.post',
      auth.verify,
      jurorDetails.postIneligibleAge(app));
    app.post(`${urlDigitalPrefix}/age-check`,
      'summons.update-age-digital.post',
      auth.verify,
      jurorDetails.postIneligibleAge(app));

    app.get(`${urlPaperPrefix}/eligibility`,
      'summons.update-eligibility.get',
      auth.verify,
      eligibility.get(app));
    app.post(`${urlPaperPrefix}/eligibility`,
      'summons.update-eligibility.post',
      auth.verify,
      eligibility.post(app));

    app.get(`${urlPaperPrefix}/reply-type`,
      'summons.update-reply-type.get',
      auth.verify,
      replyType.get(app));
    app.post(`${urlPaperPrefix}/reply-type`,
      'summons.update-reply-type.post',
      auth.verify,
      replyType.post(app));

    app.get(`${urlPaperPrefix}/employment`,
      'summons.update-employment.get',
      auth.verify,
      cjsEmployment.get(app));
    app.post(`${urlPaperPrefix}/employment`,
      'summons.update-employment.post',
      auth.verify,
      cjsEmployment.post(app));

    app.get(`${urlPaperPrefix}/adjustments`,
      'summons.update-adjustments.get',
      auth.verify,
      reasonableAdjustments.get(app));
    app.post(`${urlPaperPrefix}/adjustments`,
      'summons.update-adjustments.post',
      auth.verify,
      reasonableAdjustments.post(app));

    app.get(`${urlPaperPrefix}/signature`,
      'summons.update-signature.get',
      auth.verify,
      signature.get(app));
    app.post(`${urlPaperPrefix}/signature`,
      'summons.update-signature.post',
      auth.verify,
      signature.post(app));

    app.get(`${urlPaperPrefix}/details/edit-name`,
      'summons.update-details.edit-name.get',
      auth.verify,
      jurorDetails.getEditName(app));
    app.post(`${urlPaperPrefix}/details/edit-name`,
      'summons.update-details.edit-name.post',
      auth.verify,
      jurorDetails.postEditName(app));

    app.get(`${urlPaperPrefix}/details/edit-address`,
      'summons.update-details.edit-address.get',
      auth.verify,
      jurorDetails.getEditAddress(app));
    app.post(`${urlPaperPrefix}/details/edit-address`,
      'summons.update-details.edit-address.post',
      auth.verify,
      jurorDetails.postEditAddress(app));
  };

})();
