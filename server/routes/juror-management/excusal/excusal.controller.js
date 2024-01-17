(function() {
  'use strict';

  const _ = require('lodash')
    , excusalObj = require('../../../objects/excusal-mod').excusalObject
    , validate = require('validate.js');

  module.exports.index = function(app) {
    return async function(req, res) {
      const backLinkUrl = {
          built: true,
          url: app.namedRoutes.build('juror.update.get', {
            jurorNumber: req.params['jurorNumber'],
          }),
        },
        processUrl = app.namedRoutes.build('juror.excusal.post', {
          jurorNumber: req.params['jurorNumber'],
        }),
        cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['jurorNumber'],
        });

      try {
        const excusalCodesObj = require('../../../objects/excusal.js').object;

        req.session.excusalReasons = await excusalCodesObj
          .getNew(require('request-promise'), app, req.session.authToken);
      } catch (err) {
        app.logger.crit('Failed to fetch excusal codes: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      }

      const tmpErrors = _.clone(req.session.errors);

      return res.render('summons-management/excusal.njk', {
        backLinkUrl,
        processUrl,
        cancelUrl,
        sortedReasons: req.session.excusalReasons.formatted,
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      const successCB = function() {
          const codeMessage = c => req.session.excusalReasons.original.filter(r => r.excusalCode === c)[0].description
            , reason = {
              REFUSE: 'Excusal refused (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
              GRANT: 'Excusal granted (' + codeMessage(req.body.excusalCode).toLowerCase() + ')',
            };

          req.session.bannerMessage = reason[req.body.excusalDecision];

          app.logger.info('Juror excusal processed: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              ...req.body,
            },
          });

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params['jurorNumber'],
          }));
        },
        errorCB = function(err) {
          app.logger.crit('Failed to process the juror excusal: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params['jurorNumber'],
              ...req.body,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      let excusalValidator = require('../../../config/validation/excusal-mod.js'),
        validatorResult = validate(req.body, excusalValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(app.namedRoutes.build('juror.excusal.get', {
          jurorNumber: req.params['jurorNumber'],
        }));
      }

      return excusalObj.put(
        require('request-promise'),
        app,
        req.session.authToken,
        req.body,
        req.params['jurorNumber'],
        req.session.replyMethod || null,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

})();
