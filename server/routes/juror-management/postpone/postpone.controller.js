const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');

(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , postponeObj = require('../../../objects/postpone').postponeObject
    , availablePoolsObj = require('../../../objects/pool-management').deferralMaintenance.availablePools
    , postponeValidator = require('../../../config/validation/postpone')
    , validateMovementObj = require('../../../objects/pool-management').validateMovement
    , moment = require('moment')
    , modUtils = require('../../../lib/mod-utils')
    , { dateFilter } = require('../../../components/filters');

  module.exports.getPostponeDate = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;
      let originalDate;
      let backUrl;
      let processUrl;
      let cancelUrl;

      if (typeof req.session.processLateSummons !== 'undefined'){
        originalDate = new Date(req.session.jurorCommonDetails.startDate);
        backUrl = req.session.processLateSummons.backUrl;
        cancelUrl = req.session.processLateSummons.cancelUrl;
        delete req.session.processLateSummons;
      } else if (typeof req.session.poolJurorsPostpone !== 'undefined'){
        originalDate = new Date(req.session.poolJurorsPostpone.courtStartDate);
        backUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],
        });
        processUrl = app.namedRoutes.build('juror.update.bulk-postpone-date.post', {
          poolNumber: req.params['poolNumber'] });
        cancelUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],
        });
      } else {
        originalDate = new Date(req.session.jurorCommonDetails.startDate);
        backUrl = app.namedRoutes.build('juror.update.get', {
          jurorNumber: req.params['jurorNumber'],
        });
        processUrl = app.namedRoutes.build('juror.update.postpone-date.post', {
          jurorNumber: req.params['jurorNumber'] });
        cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['jurorNumber'],
        });
      }

      originalDate.setDate(originalDate.getDate() + 1);

      return res.render('juror-management/postpone/select-date.njk', {
        originalDate: originalDate,
        postponeToDate: req.session.postponeToDate,
        backLinkUrl : {
          built: true,
          url: backUrl,
        },
        processUrl: processUrl,
        cancelUrl: cancelUrl,
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postPostponeDate = function(app) {
    return function(req, res) {
      var validatorResult
        , originalDate
        , errorUrl
        , continueUrl;

      if (typeof req.session.poolJurorsPostpone !== 'undefined'){
        originalDate = new Date(req.session.poolJurorsPostpone.courtStartDate);
        errorUrl = app.namedRoutes.build('pool-management.postpone.get', {
          poolNumber: req.params['poolNumber'],
        });
        continueUrl = app.namedRoutes.build('juror.update-bulk-postpone.available-pools.get', {
          poolNumber: req.params['poolNumber']});
      } else {
        originalDate = new Date(req.session.jurorCommonDetails.startDate);
        errorUrl = app.namedRoutes.build('juror.update.postpone-date.get', {
          jurorNumber: req.params.jurorNumber,
        });
        continueUrl = app.namedRoutes.build('juror.update.available-pools.get', {
          jurorNumber: req.params['jurorNumber'],
        });
      }
      validatorResult = validate(req.body, postponeValidator.postponeDate(originalDate));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(errorUrl);
      }
      req.session.postponeToDate = req.body.postponeTo;
      return res.redirect(continueUrl);
    };
  };

  module.exports.getAvailablePools = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)

        , successCB = function(poolOptions) {
          let backLinkUrl,
            processUrl,
            cancelUrl,
            originalDate;

          app.logger.info('Fetch pool options:  ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: poolOptions,
          });
          delete req.session.errors;
          delete req.session.formFields;
          if (typeof req.session.poolJurorsPostpone !== 'undefined'){
            backLinkUrl = {
              built: true,
              url: app.namedRoutes.build('pool-management.postpone.get', {
                poolNumber: req.params['poolNumber'],
              }),
            };
            processUrl = app.namedRoutes.build('juror.update-bulk-postpone.available-pools.post', {
              poolNumber: req.params['poolNumber'],
            });
            cancelUrl = app.namedRoutes.build('pool-overview.get', {
              poolNumber: req.params['poolNumber'],
            });
            originalDate = new Date(req.session.poolJurorsPostpone.courtStartDate);
          } else {
            backLinkUrl = {
              built: true,
              url: app.namedRoutes.build('juror.update.postpone-date.get', {
                jurorNumber: req.params['jurorNumber'],
              }),
            };
            processUrl = app.namedRoutes.build('juror.update.available-pools.post', {
              jurorNumber: req.params['jurorNumber'],
            });
            cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber'],
            });
            originalDate = moment(req.session.jurorCommonDetails.startDate);
          }
          // eslint-disable-next-line one-var
          const filteredPools = {
            ...poolOptions.deferralPoolsSummary[0],
            deferralOptions: poolOptions.deferralPoolsSummary[0].deferralOptions.filter(pool => {
              return moment(pool.serviceStartDate).isAfter(originalDate);
            }),
          };

          if (!filteredPools.deferralOptions.length) {
            return res.render('juror-management/postpone/no-pools.njk', {
              processUrl,
              cancelUrl,
              selectedDeferralDate: req.session.postponeToDate.split('/').reverse().join('-'),
            });
          }

          return res.render('juror-management/postpone/pools.njk', {
            jurorNumber: req.params['jurorNumber'],
            backLinkUrl,
            processUrl,
            cancelUrl,
            deferralPoolsSummary: filteredPools,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }

        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool options: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      let jurorNumber;

      if (typeof req.session.poolJurorsPostpone !== 'undefined') {
        jurorNumber = req.session.poolJurorsPostpone.selectedJurors[0];
      } else {
        jurorNumber = req.params['jurorNumber'];
      }

      availablePoolsObj.post(
        require('request-promise'),
        app,
        req.session.authToken,
        jurorNumber,
        [req.session.postponeToDate.split('/').reverse().join('-')]
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postAvailablePools = function(app) {
    return function(req, res) {
      var validatorResult
        , errorUrl
        , sendingCourtLocCode
        , sourcePoolNumber
        , jurorNumbers;

      if (typeof req.session.poolJurorsPostpone !== 'undefined') {
        errorUrl = app.namedRoutes.build('juror.update-bulk-postpone.available-pools.get', {
          poolNumber: req.params.poolNumber,
        });
        sendingCourtLocCode = req.params.poolNumber.slice(0, 3);
        sourcePoolNumber = req.params.poolNumber;
        jurorNumbers = req.session.poolJurorsPostpone.selectedJurors;
      } else {
        errorUrl = app.namedRoutes.build('juror.update.available-pools.get', {
          jurorNumber: req.params.jurorNumber,
        });
        sendingCourtLocCode = req.session.jurorCommonDetails.poolNumber.slice(0, 3);
        sourcePoolNumber = req.session.jurorCommonDetails.poolNumber;
        jurorNumbers = [req.session.jurorCommonDetails.jurorNumber];
      };

      if (typeof req.body.sendToDeferralMaintence === 'undefined') {
        validatorResult = validate(req.body, postponeValidator.postponePool());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(errorUrl);
        }
      }
      const [__, pn] = req.body.deferralDateAndPool.split('_');
      let receivingCourtLocCode;

      if (req.body.deferralDateAndPool.length === 10) {
        receivingCourtLocCode = typeof req.session.poolJurorsPostpone !== 'undefined' ?
          req.params.poolNumber.slice(0, 3) : req.session.jurorCommonDetails.poolNumber.slice(0, 3);
      } else {
        receivingCourtLocCode = pn.slice(0, 3);
      }

      let validationPayload = {
        sourcePoolNumber
        , sendingCourtLocCode
        , receivingPoolNumber: pn
        , receivingCourtLocCode
        , targetServiceStartDate: dateFilter(req.session.postponeToDate, 'DD/MM/YYYY', 'YYYY-MM-DD')
        , jurorNumbers,
      };

      typeof req.session.poolJurorsPostpone !== 'undefined' ? req.session.poolJurorsPostpone.deferralDateAndPool =
      req.body.deferralDateAndPool : req.session.jurorCommonDetails.deferralDateAndPool = req.body.deferralDateAndPool;

      validateMovementObj.validateMovement.put(
        require('request-promise'),
        app,
        req.session.authToken,
        validationPayload
      )
        .then((data) => {
          let payload = buildPayload(req.body, req, jurorNumbers);

          typeof req.session.poolJurorsPostpone !== 'undefined' ? req.session.poolJurorsPostpone.payload =
      payload : req.session.jurorCommonDetails.payload = payload;

          if (data.unavailableForMove !== null) {
            //eslint-disable-next-line
            payload.juror_numbers = data.availableForMove;
            req.session.movementData = data;
            return res.redirect(app.namedRoutes.build('juror.update-bulk-postpone.movement-check.get', {
              poolNumber: typeof req.session.poolJurorsPostpone !== 'undefined' ?
                req.params.poolNumber : req.session.jurorCommonDetails.poolNumber }));
          }

          sendPostponeRequest(app, req, res, payload);
        })
        .catch((err) => {
          app.logger.crit('Failed to check transfer validity: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.session.poolJurorsReassign ?
              req.session.poolJurorsReassign.selectedJurors : req.params['jurorNumber'],
            error:
              typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        });

    };
  };
  module.exports.getMovementCheck = function(app){
    return function(req, res){
      return res.render('pool-management/movement/bulk-validate', {
        cancelUrl: app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],

        }),
        eligibleJurorLength: typeof req.session.poolJurorsPostpone !== 'undefined' ?
          req.session.poolJurorsPostpone.payload.juror_numbers.length :
          req.session.jurorCommonDetails.payload.juror_numbers.length,
        continueUrl: app.namedRoutes.build('juror.update-bulk-postpone.continue.post', {
          poolNumber: req.params['poolNumber']}),
        problems: modUtils.buildMovementProblems(req.session.movementData),
      });
    };
  };

  module.exports.postMovementCheck = function(app){
    return function(req, res) {
      sendPostponeRequest(app, req, res, req.session.poolJurorsPostpone.payload);
    };
  };

  module.exports.getPostponeLetter = function(app) {
    return function(req, res) {
      return flowLetterGet(req, res, {
        serviceTitle: 'send letter',
        pageIdentifier: 'process - postpone',
        currentApp: '',
        letterMessage: 'a postponement',
        letterType: 'postponement',
        postUrl: app.namedRoutes.build('juror-update.postpone.letter.post', {
          jurorNumber: req.params.jurorNumber,
        }),
        cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  module.exports.postPostponeLetter = function(app) {
    return function(req, res) {
      return flowLetterPost(req, res, {
        errorRoute: app.namedRoutes.build('juror-update.postpone.letter.get', {
          jurorNumber: req.params.jurorNumber,
        }),
        pageIdentifier: 'process - postpone',
        serviceTitle: 'send letter',
        currentApp: '',
        completeRoute: app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }),
      });
    };
  };

  function sendPostponeRequest(app, req, res, payload){
    var successCB = function() {
        let receivingPoolNumberDate = typeof req.session.poolJurorsPostpone !== 'undefined' ?
          req.session.poolJurorsPostpone.deferralDateAndPool : req.session.jurorCommonDetails.deferralDateAndPool;
        let jurorNumber;
        let redirectUrl;
        let deferralUrl = app.namedRoutes.build('pool-management.deferral-maintenance.get');
        let selectedJurors = payload.juror_numbers;
        let jurorString = selectedJurors.length > 1 ? selectedJurors.length + ' jurors' : '1 juror';

        if (receivingPoolNumberDate.length === 10 && typeof req.session.poolJurorsPostpone !== 'undefined') {
          req.session.bannerMessage = jurorString
          + ' postponed to <a class="govuk-link" href='+ deferralUrl +'>deferral maintenance</a> for '
          + moment(req.session.poolJurorsPostpone.deferralDateAndPool).format('dddd DD MMMM YYYY');
        }  else if (receivingPoolNumberDate.length > 10 && typeof req.session.poolJurorsPostpone !== 'undefined') {
          let [__, pn] = receivingPoolNumberDate.split('_');
          let poolUrl = app.namedRoutes.build('pool-overview.get', {
            poolNumber: pn,
          });

          req.session.bannerMessage = jurorString
          + ' postponed to Pool <a class="govuk-link" href='+ poolUrl +'>' + pn + '</a>';
        }

        app.logger.info('Juror succesfully transferred: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            jurorNumber: jurorNumber,
            ...payload,
          },
        });

        if (typeof req.session.poolJurorsPostpone !== 'undefined') {
          jurorNumber = req.session.poolJurorsPostpone.selectedJurors;

          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          }));
        }

        jurorNumber = req.params.jurorNumber;
        req.session.bannerMessage = 'Postponed';

        if (res.locals.isCourtUser) {
          return res.redirect(app.namedRoutes.build('juror-update.postpone.letter.get', {
            jurorNumber: req.params.jurorNumber,
          }));
        }

        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params.jurorNumber,
        }));
      }

      , errorCB = function(err) {
        let jurorNumber;

        if (typeof req.session.poolJurorsPostpone !== 'undefined') {
          jurorNumber = req.session.poolJurorsPostpone.selectedJurors;
        } else {
          jurorNumber = req.params.jurorNumber;
        }
        app.logger.crit('Failed to transfer juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          jurorNumber: jurorNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      };

    postponeObj.post(
      require('request-promise'),
      app,
      req.session.authToken,
      payload)
      .then(successCB)
      .catch(errorCB);
  }

  function buildPayload(body, req, jurorNumbers) {
    const payload = _.clone(body);

    //eslint-disable-next-line
    payload.juror_numbers = jurorNumbers;
    if (payload.deferralDateAndPool) {
      const [dd, pn] = payload.deferralDateAndPool.split('_');

      payload.deferralDate = dd;
      payload.poolNumber = pn;
    }
    payload.excusalReasonCode = 'P';
    delete payload.deferralDateAndPool;
    delete payload._csrf;
    delete payload.deferralPoolSelect;
    return payload;
  }
})();
