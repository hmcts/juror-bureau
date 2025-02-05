(function() {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const postponeObj = require('../../../objects/postpone').postponeObject;
  const availablePoolsObj = require('../../../objects/pool-management').deferralMaintenance.availablePools;
  const postponeValidator = require('../../../config/validation/postpone');
  const validateMovementObj = require('../../../objects/pool-management').validateMovement;
  const moment = require('moment');
  const modUtils = require('../../../lib/mod-utils');
  const { dateFilter } = require('../../../components/filters');
  const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');

  module.exports.getPostponeDate = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;
      let originalDate;
      let backUrl;
      let processUrl;
      let cancelUrl;

      if (typeof req.session.processLateSummons !== 'undefined') {
        originalDate = new Date(req.session.jurorCommonDetails.startDate);
        backUrl = req.session.processLateSummons.backUrl;
        cancelUrl = req.session.processLateSummons.cancelUrl;
      } else if (typeof req.session.poolJurorsPostpone !== 'undefined') {
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

  module.exports.getPostponeDateDeferralMaintenance = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      const originalDate = req.session.selectedDeferralJurors.reduce((prev, current) => {
        if (moment(current.deferredTo, 'YYYY-MM-DD').isAfter(prev)) {
          return moment(current.deferredTo, 'YYYY-MM-DD');
        }

        return prev;
      }, new Date());
      const backUrl = app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode: req.params.locationCode,
      });
      const processUrl = app.namedRoutes.build('pool-management.deferral-maintenance.postpone.date.post', {
        locationCode: req.params.locationCode,
      });
      let cancelUrl = app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode: req.params.locationCode,
      });

      originalDate.date(originalDate.date() + 1);
      req.session.originalDate = originalDate;

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
      let originalDate;
      let errorUrl;
      let continueUrl;

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
      const validatorResult = validate(req.body, postponeValidator.postponeDate(originalDate));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(errorUrl);
      }
      req.session.postponeToDate = req.body.postponeTo;
      return res.redirect(continueUrl);
    };
  };

  module.exports.postPostponeDateDeferralMaintenance = function(app) {
    return function(req, res) {
      const validatorResult = validate(req.body, postponeValidator.postponeDate(req.session.originalDate));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.postpone.date.get', {
          locationCode: req.params.locationCode,
        }));
      }

      req.session.postponeToDate = req.body.postponeTo;

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.postpone.pool.get', {
        locationCode: req.params.locationCode,
      }));
    };
  };

  module.exports.getAvailablePools = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const tmpFields = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      let jurorNumber;

      if (typeof req.session.poolJurorsPostpone !== 'undefined') {
        jurorNumber = req.session.poolJurorsPostpone.selectedJurors[0];
      } else {
        jurorNumber = req.params['jurorNumber'];
      }

      availablePoolsObj.post(
        req,
        jurorNumber,
        [req.session.postponeToDate.split('/').reverse().join('-')]
      )
      .then(poolOptions => {
        let backLinkUrl;
        let processUrl;
        let cancelUrl;
        let originalDate;

        app.logger.info('Fetch pool options:  ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: poolOptions,
        });
        
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

        if (typeof req.session.processLateSummons !== 'undefined') {
          cancelUrl = req.session.processLateSummons.cancelUrl;
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
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
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
          tmpFields,
        });
      })
      .catch(err => {
        app.logger.crit('Failed to fetch pool options: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      });
    };
  };

  module.exports.getAvailablePoolsDeferralMaintenance = function(app) {
    return function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const { jurorNumber } = req.session.selectedDeferralJurors[0];

      availablePoolsObj.post(
        req, jurorNumber,
        [req.session.postponeToDate.split('/').reverse().join('-')]
      ).then(poolOptions => {
        app.logger.info('Fetch pool options:  ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: poolOptions,
        });

        delete req.session.originalDate;
        delete req.session.errors;
        delete req.session.formFields;

        const backLinkUrl = {
          built: true,
          url: app.namedRoutes.build('pool-management.deferral-maintenance.postpone.date.get', {
            locationCode: req.params.locationCode,
          }),
        };
        const processUrl = app.namedRoutes.build('pool-management.deferral-maintenance.postpone.pool.post', {
          locationCode: req.params.locationCode,
        });
        const cancelUrl = app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params.locationCode,
        });
        const originalDate = req.session.originalDate;

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
      }).catch(err => {
        app.logger.crit('Failed to fetch pool options: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      });
    };
  };

  module.exports.postAvailablePools = function(app) {
    return function(req, res) {
      let errorUrl;
      let sendingCourtLocCode;
      let sourcePoolNumber;
      let jurorNumbers;

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
       const validatorResult = validate(req.body, postponeValidator.postponePool());
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
        sourcePoolNumber,
        sendingCourtLocCode,
        receivingPoolNumber: pn,
        receivingCourtLocCode,
        targetServiceStartDate: dateFilter(req.session.postponeToDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
        jurorNumbers,
      };

      typeof req.session.poolJurorsPostpone !== 'undefined' ? req.session.poolJurorsPostpone.deferralDateAndPool =
      req.body.deferralDateAndPool : req.session.jurorCommonDetails.deferralDateAndPool = req.body.deferralDateAndPool;

      validateMovementObj.validateMovement.put(
        req,
        validationPayload
      )
        .then((data) => {
          let payload = buildPayload(req.body, req, jurorNumbers);

          typeof req.session.poolJurorsPostpone !== 'undefined' ? req.session.poolJurorsPostpone.payload =
            payload : req.session.jurorCommonDetails.payload = payload;

          if (data.unavailableForMove !== null) {
            //eslint-disable-next-line
            payload.jurorNumbers = data.availableForMove;
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

  module.exports.postPostponePoolDeferralMaintenance = function(app) {
    return function(req, res) {
      let validatorResult;
      const errorUrl = app.namedRoutes.build('pool-management.deferral-maintenance.postpone.pool.get', {
        locationCode: req.params.locationCode,
      });
      const jurorNumbers = req.session.selectedDeferralJurors.map(juror => juror.jurorNumber);

      if (typeof req.body.sendToDeferralMaintence === 'undefined') {
        validatorResult = validate(req.body, postponeValidator.postponePool());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(errorUrl);
        }
      }

      const poolNumbers = req.session.selectedDeferralJurors.reduce((prev, curr) => {
        if (prev.find(item => curr.poolNumber === item.poolNumber)) {
          return prev;
        }

        return [...prev, curr.poolNumber];
      }, []);

      Promise.all(
        poolNumbers.map(poolNumber => {
          return validateMovementObj.validateMovement.put(
            req,
            {
              sourcePoolNumber: poolNumber,
              sendingCourtLocCode: req.params.locationCode,
              receivingPoolNumber: req.body.deferralDateAndPool.split('_')[1],
              receivingCourtLocCode: req.params.locationCode,
              targetServiceStartDate: dateFilter(req.session.postponeToDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
              jurorNumbers: req.session.selectedDeferralJurors.reduce((prev, curr) => {
                if (curr.poolNumber === poolNumber) {
                  return [...prev, curr.jurorNumber];
                }

                return prev;
              }, []),
              'deferralMaintenance': true,
            }
          );
        })
      ).then((data) => {
        const payload = buildPayload(req.body, req, jurorNumbers);

        req.session.postponeDeferralMaintenancePayload = payload;

        const combinedData = {
          availableforMove: data.reduce((prev, curr) => [...prev, ...curr.availableForMove], []),
          unavailableForMove: data.reduce((prev, curr) => {
            if (curr.unavailableForMove) {
              return [...prev, ...curr.unavailableForMove];
            }

            return prev;
          }, []),
        };

        if (combinedData.unavailableForMove.length !== 0) {
          payload['juror_numbers'] = combinedData.availableforMove;
          req.session.movementData = combinedData;

          return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.postpone.movement.get', {
            locationCode: req.params.locationCode,
          }));
        }

        sendPostponeFromDeferralMaintenance(app, req, res, payload);
      }).catch(err => {
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
          req.session.poolJurorsPostpone.payload.jurorNumbers.length :
          req.session.jurorCommonDetails.payload.jurorNumbers.length,
        continueUrl: app.namedRoutes.build('juror.update-bulk-postpone.continue.post', {
          poolNumber: req.params['poolNumber']}),
        problems: modUtils.buildMovementProblems(req.session.movementData),
      });
    };
  };

  module.exports.getPostponeMovementDeferralMaintenance = function(app) {
    return function(req, res) {
      return res.render('pool-management/movement/bulk-validate', {
        cancelUrl: app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params.locationCode,
        }),
        eligibleJurorLength: req.session.postponeDeferralMaintenancePayload.jurorNumbers.length,
        continueUrl: app.namedRoutes.build('pool-management.deferral-maintenance.postpone.movement.post', {
          locationCode: req.params.locationCode,
        }),
        problems: modUtils.buildMovementProblems(req.session.movementData),
      });
    };
  };

  module.exports.postMovementCheck = function(app){
    return function(req, res) {
      sendPostponeRequest(app, req, res, req.session.poolJurorsPostpone.payload);
    };
  };

  module.exports.postPostponeMovementDeferralMaintenance = function(app){
    return function(req, res) {
      const payload = req.session.postponeDeferralMaintenancePayload;

      delete req.session.postponeDeferralMaintenancePayload;

      return sendPostponeFromDeferralMaintenance(app, req, res, payload);
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
        let deferralUrl = app.namedRoutes.build('pool-management.deferral-maintenance.get');
        let selectedJurors = payload.jurorNumbers;
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

        delete req.session.processLateSummons;

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
        let errorRedirect;
        if (typeof req.session.poolJurorsPostpone !== 'undefined') {
          jurorNumber = req.session.poolJurorsPostpone.selectedJurors;
          if (err.statusCode === 422 && err.error.code === 'CANNOT_DEFER_JUROR_WITH_APPEARANCE') {
            errorRedirect = app.namedRoutes.build('juror.update-bulk-postpone.available-pools.get', {
              poolNumber: req.params.poolNumber,
            });
            req.session.errors = modUtils.makeManualError('postpone', 'One or more jurors cannot be postponed as they already have an appearance at court');
            req.session.formFields = req.body;
          }
          if (err.statusCode === 422 && err.error.code === 'JUROR_DATE_OF_BIRTH_REQUIRED') {
            errorRedirect = app.namedRoutes.build('juror.update-bulk-postpone.available-pools.get', {
              poolNumber: req.params.poolNumber,
            });
            req.session.errors = modUtils.makeManualError('postpone', 'You cannot postpone a juror without a date of birth - please ensure all selected jurors have a date of birth');
            req.session.formFields = req.body;
          }
        } else {
          jurorNumber = req.params.jurorNumber;
          if (err.statusCode === 422 && err.error.code === 'CANNOT_DEFER_JUROR_WITH_APPEARANCE') {
            errorRedirect = app.namedRoutes.build('juror.update.available-pools.get', {
              jurorNumber: req.params.jurorNumber,
            });
            req.session.errors = modUtils.makeManualError('postpone', 'Juror cannot be postponed as they already have an appearance at court');
            req.session.formFields = req.body;
          }
          if (err.statusCode === 422 && err.error?.code === 'JUROR_DATE_OF_BIRTH_REQUIRED') {
            console.log('\n\nIN HERE2\n\n');
            errorRedirect = app.namedRoutes.build('juror.update.available-pools.get', {
              jurorNumber: req.params.jurorNumber,
            });
            req.session.errors = modUtils.makeManualError('postpone', 'You cannot postpone a juror without a date of birth - please add date of birth to the juror record');
            req.session.formFields = req.body;
          }
        }

        app.logger.crit('Failed to transfer juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          jurorNumber: jurorNumber,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return errorRedirect ? res.redirect(errorRedirect) : res.render('_errors/generic');
      };

    postponeObj.post(
      req,
      payload)
      .then(successCB)
      .catch(errorCB);
  }

  function sendPostponeFromDeferralMaintenance(app, req, res, payload) {
    postponeObj.post(
      req,
      payload)
      .then((resp) => {
        let receivingPoolNumberDate = req.body.deferralDateAndPool;
        let selectedJurors = payload.jurorNumbers;
        let jurorString = selectedJurors.length > 1 ? selectedJurors.length + ' jurors' : '1 juror';

        if (!payload.poolNumber) {
          req.session.bannerMessage = jurorString
          + ' postponed to deferral maintenance for '
          + moment(receivingPoolNumberDate).format('dddd DD MMMM YYYY');
        }  else {
          let poolNumber = receivingPoolNumberDate.split('_')[1];
          let poolUrl = app.namedRoutes.build('pool-overview.get', {
            poolNumber: poolNumber,
          });

          req.session.bannerMessage = jurorString
          + ' postponed to Pool <a class="govuk-link" href='+ poolUrl +'>' + poolNumber + '</a>';
        }

        delete req.session.processLateSummons;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get', {
          courtLocation: req.params.courtLocation,
        }));

      })
      .catch((err) => {
        app.logger.crit('Failed to postpone juror: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          payload,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422 && err.error?.code === 'JUROR_DATE_OF_BIRTH_REQUIRED') {
          req.session.errors = modUtils.makeManualError('postpone', 'You cannot postpone a juror without a date of birth - please ensure all selected jurors have a date of birth');

          return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.postpone.pool.get', {
            locationCode: req.params.locationCode,
          }));
        }

        return res.render('_errors/generic');
      });
  }

  function buildPayload(body, req, jurorNumbers) {
    const payload = _.clone(body);

    //eslint-disable-next-line
    payload.jurorNumbers = jurorNumbers;
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
