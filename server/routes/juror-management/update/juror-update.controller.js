(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , { isCourtUser } = require('../../../components/auth/user-type')
    , jurorUpdateValidator = require('../../../config/validation/juror-record-update')
    , jurorRecordObject = require('../../../objects/juror-record')
    , deferralObject = require('../../../objects/deferral-mod').deferralObject
    , jurorDeceasedObject = require('../../../objects/juror-deceased').jurorDeceasedObject
    , jurorUndeliverableObject = require('../../../objects/juror-undeliverable').jurorUndeliverableObject
    , jurorTransfer = require('../../../objects/juror-transfer').jurorTransfer
    , { dateFilter } = require('../../../components/filters')
    , { systemCodesDAO } = require('../../../objects/administration');
  const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');

  module.exports.index = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          var processUrl
            , cancelUrl
            , tmpErrors
            , radioChecked
            , thirdPartyDeceased = false
            , jurorStatus = req.session.jurorCommonDetails.jurorStatus;

          tmpErrors = _.cloneDeep(req.session.errors);
          radioChecked = _.cloneDeep(req.session.updateOption);
          thirdPartyDeceased = _.cloneDeep(req.session.thirdPartyDeceased);
          delete req.session.errors;
          delete req.session.updateOption;
          delete req.session.thirdPartyDeceased;
          delete req.session.replyMethod;
          delete req.session.processLateSummons;

          req.session.replyMethod = response.data.replyMethod;

          processUrl = app.namedRoutes.build('juror.update.post', { jurorNumber: req.params['jurorNumber'] });
          cancelUrl = app.namedRoutes.build('juror-record.overview.get', { jurorNumber: req.params['jurorNumber'] });

          return res.render('juror-management/update-juror-record.njk', {
            jurorNumber: req.params.jurorNumber,
            processUrl,
            cancelUrl,
            radioChecked: radioChecked,
            thirdPartyDeceased: thirdPartyDeceased,
            replyStatus: response.data.replyStatus,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
            isCourtUser: isCourtUser(req),
            jurorStatus,
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch juror record details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['jurorNumber'],
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        };

      jurorRecordObject.record.get(
        require('request-promise'),
        app,
        req.session.authToken,
        'summons-reply',
        req.params['jurorNumber'],
        req.session.locCode,
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var validatorResult
        , postPaths = {
          deferral: 'juror.update.deferral.get',
          transfer: 'juror.update.transfer.get',
          reassign: 'juror-management.reassign.get',
          postpone: 'juror.update.postpone-date.get',
          complete: 'juror.update.complete-service.get',
          'failed-to-attend': 'juror.update.failed-to-attend.get',
          'undo-failed-to-attend': 'juror.update.failed-to-attend.undo.get',
          excusal: 'juror.excusal.get',
        };

      validatorResult = validate(req.body, jurorUpdateValidator.updateOptions());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      if (req.body.jurorRecordUpdate === 'deceased') {
        return postDeceased(req, res, app);
      } else if (req.body.jurorRecordUpdate === 'undeliverable') {
        return postUndeliverable(req, res, app);
      }

      // Just a small fallback error message to avoid displaying stack traces when the option is not available yet
      // TODO: remove when all are implemented
      if (typeof postPaths[req.body.jurorRecordUpdate] === 'undefined') {
        req.session.errors = {
          jurorRecordUpdate: [{
            summary: 'This option is not implemented yet',
            details: 'This option is not implemented yet',
          }],
        };

        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      return res.redirect(app.namedRoutes.build(postPaths[req.body.jurorRecordUpdate], {
        jurorNumber: req.params.jurorNumber,
      }));
    };
  };

  module.exports.getDeferral = function(app) {
    return function(req, res) {
      var tmpErrors
        , tmpFields
        , processURL
        , cancelUrl

        , successCB = function(data) {
          app.logger.info('Fetched list of deferral reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.jurorNumber,
              reasons: data,
            },
          });

          tmpFields = _.cloneDeep(req.session.formFields);
          tmpErrors = _.cloneDeep(req.session.errors);

          delete req.session.formFields;
          delete req.session.errors;

          processURL = app.namedRoutes.build('juror.update.deferral.post', { jurorNumber: req.params.jurorNumber });
          req.session.deferralReasons = data;

          return res.render('response/process/deferral.njk', {
            deferralDetails: tmpFields,
            deferralReasons: data,
            jurorNumber: req.params.jurorNumber,
            processURL : processURL,
            cancelUrl : cancelUrl,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch list of deferral reasons: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.errors = {
            deferralReasons: [{
              summary: 'Failed to fetch list of deferral reasons',
              details: 'Failed to fetch list of deferral reasons',
            }],
          };
          return res.redirect(app.namedRoutes.build(
            'juror-record.overview.get',
            { jurorNumber: req.params.jurorNumber },
          ));
        };

      cancelUrl = app.namedRoutes.build('juror-record.overview.get', { jurorNumber: req.params['jurorNumber'] });

      systemCodesDAO.get(app, req, 'EXCUSAL_AND_DEFERRAL')
        .then(successCB)
        .catch(errorCB);

    };
  };

  module.exports.postDeferral = function(app) {
    return function(req, res) {
      var validatorResult
        , tmpReasons
        , deferralReason

        , successCB = function(data) {
          app.logger.info('Deferral update processed: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.jurorNumber,
            },
            reasons: data,
          });

          if (req.body.deferralDecision === 'REFUSE') {
            req.session.bannerMessage = 'Deferral refused (' + deferralReason + ')';
          } else {
            req.session.bannerMessage = 'Deferral granted (' + deferralReason + ')';
          }

          if (res.locals.isCourtUser) {
            return res.redirect(app.namedRoutes.build('juror.update.deferral.letter.get', {
              jurorNumber: req.params.jurorNumber,
              letter: req.body.deferralDecision.toLowerCase(),
            }));
          }

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to process deferral update: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              responseId: req.params.jurorNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          if (err.statusCode === 422) {
            app.logger.warn('Failed to decline deferral for juror', {
              auth: req.session.authentication,
              token: req.session.authToken,
              error: typeof err.error !== 'undefined' ? err.error : err.toString(),
            });
          }
          req.session.errors = {
            deferralError: [{
              details: err.error.message,
              summary: err.error.message,
            }],
          };

          return res.redirect(app.namedRoutes.build('juror.update.deferral.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        };

      tmpReasons = _.cloneDeep(req.session.deferralReasons);

      delete req.session.deferralReasons;
      delete req.session.formFields;

      validatorResult = validate(req.body,
        require('../../../config/validation/deferral-mod.js').deferralReasonAndDecision(req.body));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('juror.update.deferral.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      deferralReason = tmpReasons
        .find(reason => reason.code === req.body.deferralReason).description.toLowerCase();

      deferralObject.put(require('request-promise'), app, req.session.authToken, req.body, req.params.jurorNumber)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getDeferralLetter = function(app) {
    return function(req, res) {
      const letterType = req.params.letter === 'grant' ? 'granted' : 'refused';

      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - deferral',
        currentApp: '',
        letterMessage: `a deferral ${letterType}`,
        letterType: `deferral-${letterType}`,
        postUrl: app.namedRoutes.build('juror.update.deferral.letter.post', {
          jurorNumber: req.params.jurorNumber,
          letter: req.params.letter,
        }),
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  module.exports.postDeferralLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('juror.update.deferral.letter.get', {
          jurorNumber: req.params.jurorNumber,
          letter: req.params.letter,
        }),
        pageIdentifier: 'process - deferral',
        serviceTitle: 'send letter',
        currentApp: '',
        completeRoute: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  module.exports.postCourtTransferConfirm = function(app) {
    return function(req, res) {
      var newServiceStartDate
        , receivingCourtLocCode
        , sourcePoolNumber

        , successCB = function(data) {
          app.logger.info('Juror succesfully transferred: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              receivingCourt: receivingCourtLocCode,
              data: data,
            },
          });

          req.session.bannerMessage = 'juror transferred to ' + req.session.formField.courtNameOrLocation;

          delete req.session.formField;
          delete req.session.jurorUpdate;

          return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
            jurorNumber: req.params.jurorNumber,
          }));

        }

        , errorCB = function(err) {
          app.logger.crit('Failed to transfer juror: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              jurorNumber: req.params.jurorNumber,
              receivingCourt: receivingCourtLocCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      receivingCourtLocCode = req.session.formField.courtNameOrLocation.match(/\d+/g)[0];

      newServiceStartDate = dateFilter(req.session.formField.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');

      sourcePoolNumber = _.cloneDeep(req.session.jurorUpdate.poolNumber);

      jurorTransfer.put(
        require('request-promise'),
        app,
        req.session.authToken,
        req.params.jurorNumber,
        receivingCourtLocCode,
        newServiceStartDate,
        sourcePoolNumber)
        .then(successCB)
        .catch(errorCB);
    };
  };

  function postDeceased(req, res, app) {
    var validatorResult
      , successCB = function(data) {

        app.logger.info('Juror processed as deceased: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            responseId: req.params.jurorNumber,
            reasons: data,
          },
        });

        req.session.bannerMessage = 'Deceased';

        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      , errorCB = function(err) {
        app.logger.crit('Failed to process juror as deceased: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            responseId: req.params.jurorNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          deceased: [{
            summary: 'Failed to process juror as deceased',
            details: 'Failed to process juror as deceased',
          }],
        };
        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      };

    validatorResult = validate(req.body, jurorUpdateValidator.deceasedComment());
    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.updateOption = req.body.jurorRecordUpdate;
      req.session.thirdPartyDeceased = req.body.thirdPartyDeceased;

      return res.redirect(app.namedRoutes.build('juror.update.get', {
        jurorNumber: req.params.jurorNumber,
      }));
    }

    jurorDeceasedObject.post(require('request-promise'), app, req.session.authToken, req.body, req.params.jurorNumber)
      .then(successCB)
      .catch(errorCB);
  }

  function postUndeliverable(req, res, app) {
    var successCB = function(data) {

        app.logger.info('Juror processed as undeliverable: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            responseId: req.params.jurorNumber,
            reasons: data,
          },
        });

        req.session.bannerMessage = 'Summons undeliverable';

        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      , errorCB = function(err) {
        app.logger.crit('Failed to process juror as undeliverable: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            responseId: req.params.jurorNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.errors = {
          undeliverable: [{
            summary: 'Failed to mark summons as undeliverable',
            details: 'Failed to mark summons as undeliverable',
          }],
        };
        return res.redirect(app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      };

    jurorUndeliverableObject.put(require('request-promise'), app, req.session.authToken, req.params.jurorNumber)
      .then(successCB)
      .catch(errorCB);
  }

})();
