(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , disqualifyValidator = require('../../../../config/validation/disqualify-mod')
    , getDisqualificationReasons = require('../../../../objects/disqualify-mod').getDisqualificationReasons
    , disqualifyJuror = require('../../../../objects/disqualify-mod').disqualifyJuror;
  const { flowLetterGet, flowLetterPost } = require('../../../../lib/flowLetter');

  module.exports.getDisqualify = (app) => {
    return (req, res) => {
      let routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        },
        backLinkUrl = app.namedRoutes.build('process-reply.get', routeParameters),
        processUrl = app.namedRoutes.build('process-disqualify.post', routeParameters),
        cancelUrl;

      if (req.params['type'] === 'paper') {
        cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
      } else {
        cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
      }

      let tmpErrors = _.clone(req.session.errors),
        tmpFields = req.session.formFields;

      delete req.session.errors;
      delete req.session.formFields;

      getDisqualificationReasons.get(require('request-promise'), app, req.session.authToken)
        .then((data) => {
          app.logger.info('Fetched disqualification reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: data,
          });

          tmpFields = req.session.formFields;

          delete req.session.errors;
          delete req.session.formFields;

          req.session.disqualificationReasons = data.disqualifyReasons;

          return res.render('summons-management/process-reply/disqualify', {
            processUrl: processUrl,
            cancelUrl: cancelUrl,
            backLinkUrl: backLinkUrl,
            disqualifyDetails: tmpFields,
            disqualifyReasons: req.session.disqualificationReasons,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });
        }).catch((err) => {
          app.logger.crit('Failed to retrieve disqualification reasons', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params.id,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    }
  }

  module.exports.postDisqualify = (app) => {
    return (req, res) => {
      let routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        },
        validatorResult = validate(req.body, disqualifyValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('process-disqualify.get', routeParameters));
      }

      disqualifyJuror.patch(require('request-promise'), app, req.session.authToken, req.params.id,
        req.body.disqualifyReason, req.params.type)
        .then(() => {
          app.logger.info('Juror disqualified: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params.id,
            data: req.body,
          });

          let actionProcessed = (disqualifyCode) => req.session.disqualificationReasons.filter(
            (i) => i.code === disqualifyCode)[0].description

          req.session.responseWasActioned = {
            jurorDetails: req.session.replyDetails,
            type: 'Disqualified (' + actionProcessed(req.body.disqualifyReason) + ')',
          };

          delete req.session.disqualificationReasons;

          if (res.locals.isCourtUser) {
            return res.redirect(app.namedRoutes.build('process-disqualify.letter.get', routeParameters));
          }

          if (routeParameters.type === 'paper') {
            return res.redirect(app.namedRoutes.build('response.paper.details.get', routeParameters));
          }
          return res.redirect(app.namedRoutes.build('response.detail.get', routeParameters));

        }).catch((err) => {
          app.logger.crit('Failed to process juror disqualification', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params.id,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        });
    };
  };

  module.exports.getDisqualifyLetter = function(app) {
    return function(req, res) {
      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - what to do',
        currentApp: 'Summons replies',
        letterMessage: 'a disqualification',
        letterType: 'withdrawal',
        postUrl: app.namedRoutes.build('process-disqualify.letter.post', {
          id: req.params.id,
          type: req.params.type,
        }),
        cancelUrl: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };

  module.exports.postDisqualifyLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('process-disqualify.letter.get', {
          id: req.params.id,
          type: req.params.type,
        }),
        pageIdentifier: 'process - what to do',
        serviceTitle: 'send letter',
        currentApp: 'Summons replies',
        completeRoute: app.namedRoutes.build('inbox.todo.get'),
      });
    };
  };
})();
