(function() {
  'use strict';

  const  _ = require('lodash')
    , createTrialValidator = require('../../../config/validation/create-trial')
    , validate = require('validate.js')
    // stubbed will get judges/courtrooms from backend
    , { judges, allCourtrooms } = require('../../../stores/trials')
    , trialPayloadBuilder = require('../common-functions').trialPayloadBuilder;

  module.exports.getEditTrial = function(app) {
    return function(req, res) {
      let tmpErrors
        , tmpFields;

      // STUBBED - trial details will be pulled from backend
      const trial = req.session.trials.find(t => t.trialNumber === req.params.trialNumber);

      req.session.courtrooms = allCourtrooms;

      tmpErrors = _.clone(req.session.errors);
      tmpFields = _.clone(req.session.formFields);
      delete req.session.errors;
      delete req.session.formFields;

      if (typeof tmpFields === 'undefined') {
        req.session.originalTrialNumber = trial.trialNumber;
        tmpFields = _.clone(trial);
        tmpFields.defendants = trial.trialType === 'criminal' ? trial.parties : '';
        tmpFields.respondents = trial.trialType === 'civil' ? trial.parties : '';
      }

      return res.render('trial-management/create-trial.njk', {
        nav: 'trials',
        editTrial: true,
        courts: allCourtrooms,
        judges,
        processUrl: app.namedRoutes.build('trial-management.edit-trial.post', {trialNumber: req.params.trialNumber}),
        cancelUrl: app.namedRoutes.build('trial-management.trials.detail.get', {trialNumber: req.params.trialNumber}),
        trialDetails: tmpFields,
        errors: {
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postEditTrial = function(app) {
    return function(req, res) {

      const courtrooms = _.clone(req.session.courtrooms);
      const originalTrialNumber = _.clone(req.session.originalTrialNumber);

      delete req.session.courtrooms;
      delete req.session.originalTrialNumber;

      if (courtrooms.length > 1){
        const courtroom = req.body[req.body.court + 'Courtroom'];

        req.body.courtroom = courtroom;
      }

      let validatorResult = validate(req.body, createTrialValidator.trialDetails(courtrooms));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(
          app.namedRoutes.build('trial-management.edit-trial.get', {trialNumber: req.params.trialNumber})
        );
      }

      const payload = trialPayloadBuilder(req.body);

      // Remove current data from session and add new - due to ability to change trial number
      // Will be handled in backend in future
      req.session.trials = req.session.trials.filter(function(trial) {
        return trial.trialNumber !== originalTrialNumber;
      });

      req.session.trials.push(payload);

      return res.redirect(
        app.namedRoutes.build('trial-management.trials.detail.get', {trialNumber: payload.trialNumber})
      );
    };
  };


})();
