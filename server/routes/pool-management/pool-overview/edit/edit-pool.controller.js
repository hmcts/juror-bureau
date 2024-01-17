(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , editNoRequested = require('../../../../objects/edit-pool').editNoRequested
    , poolSummaryObj = require('../../../../objects/pool-summary').poolSummaryObject
    , editPoolValidator = require('../../../../config/validation/edit-pool');

  module.exports.index = function(app) {
    return function(req, res) {
      var tmpErrors
        , successCB = function(response) {
          var noRequested
            , totalRequired
            , reasonForChange
            , tmpError;

          if (req.session.hasOwnProperty('editPool')) {
            reasonForChange = req.session.editPool.reasonForChange;
            if (req.session.authentication.owner === '400') {
              noRequested = req.session.editPool.noOfJurors;
            } else if (req.session.authentication.owner !== '400') {
              totalRequired = req.session.editPool.noOfJurors;
            }
          }

          if (typeof req.session.postError !== 'undefined') {
            tmpError = req.session.postError;
            delete req.session.postError;
          }

          app.logger.info('Fetched pool summary: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.params['poolNumber'],
              response: response,
            },
          });

          return res.render('pool-management/pool-overview/edit/index', {
            poolNumber: req.params['poolNumber'],
            noRequired: response.poolSummary.requiredPoolSize,
            noRequested: (typeof noRequested !== 'undefined')
              ? noRequested : response.bureauSummoning.required,
            totalRequired: (typeof totalRequired !== 'undefined')
              ? totalRequired : response.poolSummary.requiredPoolSize,
            reasonForChange: (typeof reasonForChange !== 'undefined')
              ? reasonForChange : '',
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
            postError: tmpError,
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool summary: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.params['poolNumber'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', {
            currentApp: 'Pool management',
            title: 'Pool not found',
            message: 'The pool you are trying to edit does not exist',
          });
        }

      tmpErrors = _.clone(req.session.errors)
      delete req.session.errors;
      delete req.session.formFields;

      poolSummaryObj.get(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params['poolNumber']
      )
        .then(successCB)
        .catch(errorCB);
    }
  }

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , successCB = function() {

          app.logger.info('Pool edited successfully: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.body.poolNumber,
              noOfJurors: req.body.noOfJurors,
              reasonForChange: req.body.reasonForChange,
            },
          });

          // if the inputs passes validation and posts we can then delete what was set on line 105
          delete req.session.editPool;

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }))
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to edit the pool: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              poolNumber: req.body.poolNumber,
              noOfJurors: req.body.noOfJurors,
              reasonForChange: req.body.reasonForChange,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          // we could use some better naming for this 🤔
          req.session.postError = 'Something went wrong. Please check your form and try again';

          return res.redirect(app.namedRoutes.build('pool-management.edit-pool.get', {
            poolNumber: req.params['poolNumber']
          }));
        }
        , bodyKey;

      // we should store some data in session for page reloads and to re-populate in case of error
      req.session.editPool = {};
      for (bodyKey in req.body) {
        if (req.body.hasOwnProperty(bodyKey)) {
          req.session.editPool[bodyKey] = req.body[bodyKey];
        }
      }

      validatorResult = validate(req.body, editPoolValidator(
        req.body.noRequired,
        req.session.authentication.owner,
        (typeof req.body.noRequested) ? req.body.noRequested : null
      ));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('pool-management.edit-pool.get', {
          poolNumber: req.params['poolNumber']
        }));
      }

      editNoRequested.put(
        require('request-promise'),
        app,
        req.session.authToken,
        req.body,
        req.session.authentication.owner
      )
        .then(successCB)
        .catch(errorCB);
    }
  }

})();
