(function() {
  'use strict';

  const _ = require('lodash')
    , urljoin = require('url-join')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/document-exemption-duration'),
    { judgesObject } = require('../../../objects/create-trial');

  module.exports.getExemptionDuration = function(app) {
    return async function(req, res) {
      const backLinkUrl = app.namedRoutes.build('documents.get');
      const cancelUrl = app.namedRoutes.build('documents.certificate-of-exemption.get');
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);
      const { caseNumber } = req.params;
      const originalJudge = req.session.exemptionLetter.originalJudge;

      delete req.session.errors;
      delete req.session.formFields;

      const postUrl = app.namedRoutes.build('documents.certificate-of-exemption-duration.post', {
        caseNumber,
      });

      try {
        const judgeData = await judgesObject.get(req);

        req.session.exemptionLetter = { judges: judgeData.judges };

        return res.render('documents/exemption/exemption-duration.njk', {
          pageIdentifier: 'Exemption details',
          judges: judgeData.judges.map(j => j.description),
          originalJudge,
          backLinkUrl,
          cancelUrl,
          postUrl,
          errors: {
            title: 'There is a problem',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
          tmpBody,
        });
      } catch (err) {
        app.logger.crit('Failed to fetch judges list: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: { ...req.body },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postExemptionDuration = function(app) {
    return async function(req, res) {
      const { caseNumber } = req.params;
      const judges = _.clone(req.session.exemptionLetter.judges);

      delete req.session.exemptionLetter.judges;

      const validatorResult = validate(req.body, validator(judges));

      delete req.session.errors;
      req.session.formFields = req.body;

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(urljoin(app.namedRoutes.build('documents.certificate-of-exemption-duration.get', {
          caseNumber,
        }), urlBuilder(req.body)));
      }

      req.session.exemptionLetter.judge = req.body.judge;

      return res.redirect(urljoin(app.namedRoutes.build('documents.certificate-of-exemption-list.get', {
        caseNumber,
      }), urlBuilder(req.body)));

    };
  };

  function urlBuilder(params) {
    var parameters = [];

    if (params.durationType) {
      parameters.push('durationType=' + params.durationType);
    }

    if (params.durationYears) {
      parameters.push('durationYears=' + params.durationYears);
    }

    return  '?' + parameters.join('&');
  }

})();
