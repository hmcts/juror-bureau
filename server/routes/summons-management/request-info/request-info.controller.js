(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , summonsValidator = require('../../../config/validation/summons-management')
    , requestInfoObj = require('../../../objects/summons-management').requestInfoObject;

  module.exports.getRequestInfo = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , routeParameters = {
          id: req.params['id'],
          type: req.params['type'],
        }
        , cancelUrl;

      if (req.session.replyDetails.jurorNumber !== req.params['id']) {
        return res.redirect(app.namedRoutes('response.detail.get', {
          id: req.params['id'],
        }));
      }

      if (req.params['type'] === 'paper') {
        cancelUrl = app.namedRoutes.build('response.paper.details.get', routeParameters);
      } else {
        cancelUrl = app.namedRoutes.build('response.detail.get', routeParameters);
      }

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('summons-management/request-info/form', {
        response: req.session.replyDetails,
        requestInfo: req.session.requestInfo,
        cancelUrl: cancelUrl,
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        }
      });
    }
  }

  module.exports.postRequestInfo = function(app) {
    return function(req, res) {
      var validatorResult
        , letterInfoDto = [];

      validatorResult = validate(req.body, summonsValidator.requestInfo());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('request-info.by-post.get', {
          id: req.params['id'],
          type: req.params['type'],
        }));
      }

      req.session.requestInfo = _.clone(req.body);
      delete req.session.requestInfo._csrf;

      Object.values(req.session.requestInfo).forEach((infoItem) => {
        if (Array.isArray(infoItem)) {
          infoItem.forEach(singleInfoItem => letterInfoDto.push(singleInfoItem))
        } else {
          letterInfoDto.push(infoItem.toString());
        }
      })

      req.session.letterInfoDto = letterInfoDto;

      return res.redirect(app.namedRoutes.build('request-info.by-post.letter.get', {
        id: req.params['id'],
        type: req.params['type'],
      }));
    }
  }

  module.exports.getRequestInfoLetter = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;

      return res.render('summons-management/request-info/send-letter', {
        response: req.session.replyDetails,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        submitUrl:  app.namedRoutes.build('request-info.by-post.letter.post', {
          id: req.params['id'],
          type: req.params['type'],
        }),
        backLinkUrl: {
          url: app.namedRoutes.build('request-info.by-post.get', {
            id: req.params['id'],
            type: req.params['type'],
          }),
          built: true,
        },
        manual: Object.keys(req.session.requestInfo).includes('info-signature'),
      });
    }
  }

  module.exports.postRequestInfoLetter = function(app) {
    return function(req, res) {

      var successCB = function() {

          app.logger.info('Successfully requested information from juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.letterInfoDto,
          });

          delete req.session.requestInfo;
          delete req.session.letterInfoDto;
          delete req.session.missingAwaitInfo;

          if (req.params['type'] === 'paper') {
            return res.redirect(app.namedRoutes.build('response.paper.details.get', {
              id: req.params['id'],
              type: 'paper',
            }));
          }
          return res.redirect(app.namedRoutes.build('response.detail.get', {
            id: req.params['id'],
          }));

        }
        , errorCB = function(err) {

          app.logger.crit('Failed to request information from juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: req.session.letterInfoDto,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = {
            sendLetter: [{
              summary: 'Request could not be processed',
              details: 'Request could not be processed',
            }],
          };

          return res.redirect(app.namedRoutes.build('request-info.by-post.letter.get', {
            id: req.params['id'],
            type: req.params['type'],
          }));
        }

      if (req.body.manual === 'true') {

        app.logger.info('Letter to be manually sent to the juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: req.session.letterInfoDto,
        });

        delete req.session.requestInfo;
        delete req.session.letterInfoDto;

        if (req.params['type'] === 'paper') {
          return res.redirect(app.namedRoutes.build('response.paper.details.get', {
            id: req.params['id'],
            type: 'paper',
          }));
        }
        return res.redirect(app.namedRoutes.build('response.detail.get', {
          id: req.params['id'],
        }));
      }

      requestInfoObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['id'].toString(),
        req.session.letterInfoDto,
        req.params['type'].toUpperCase()
      )
        .then(successCB)
        .catch(errorCB);

    }
  }

})();
