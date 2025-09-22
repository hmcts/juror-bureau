(function() {
  'use strict';
  const _ = require('lodash')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/document-exemption')
    , { certificateOfExemptionDAO } = require('../../../objects/documents')
    , modUtils = require('../../../lib/mod-utils');

  module.exports.getSelectTrial = function(app) {
    return function(req, res) {
      const backLinkUrl = app.namedRoutes.build('documents.get');
      const tmpErrors = _.clone(req.session.errors);
      const { caseNumber } = req.params;
      const locCode = req.session.authentication.owner;

      certificateOfExemptionDAO.getTrialExemptionList(
        req,
        locCode
      )
        .then((response) => {
          delete req.session.errors;

          const postUrl = app.namedRoutes.build('documents.certificate-of-exemption.post', {
            caseNumber,
          });
          const trialsList = modUtils.transformCoETrialsList(response);

          req.session.exemptionLetter = {
            trials: response,
          };

          return res.render('documents/exemption/certificate-of-exemption.njk', {
            pageIdentifier: 'Certificate of exemption',
            backLinkUrl,
            postUrl,
            trialsList,
            errors: {
              title: 'There is a problem',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch((err) => {
          app.logger.crit('Could not fetch juror details: ', {
            auth: req.session.authentication,
            data: {
              jurorNumber: req.params.id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send(err.error);

        });
    };
  };

  module.exports.postSelectTrial = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator());
      const { exemptionCaseNumber } = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('documents.certificate-of-exemption.get'));
      }
      const selectedTrial = req.session.exemptionLetter.trials.find((t) => t.case_number === exemptionCaseNumber);

      req.session.exemptionLetter.originalJudge = selectedTrial.judge;

      delete req.session.exemptionLetter.trials;

      return res.redirect(app.namedRoutes.build('documents.certificate-of-exemption-duration.get', {
        caseNumber: exemptionCaseNumber,
      }));
    };
  };
})();
