(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , requestObj = require('../../../objects/pool-management').reassignJurors
    , validator = require('../../../config/validation/pool-management').deferralMaintenance
    , modUtils = require('../../../lib/mod-utils')
    , capitalizeFully = require('../../../components/filters').capitalizeFully
    , requestCourtsObj = require('../../../objects/request-pool').fetchCourts
    , validateMovementObj = require('../../../objects/pool-management').validateMovement
    , isCourtUser = require('../../../components/auth/user-type').isCourtUser
    , { dateFilter } = require('../../../components/filters');

  module.exports.getReassignJuror = function(app) {
    return async function(req, res) {
      var successCB = function(response) {
          var tmpErrors = _.clone(req.session.errors)
            , court = req.session.courtsList.find(c => c.locationCode === req.session.receivingCourtLocCode)
            , postUrl
            , cancelUrl
            , changeCourtUrl
            , filteredPools = response.availablePools
              .filter(pool => pool.poolNumber !==
                (req.params['poolNumber'] ? req.params['poolNumber'] : req.session.jurorCommonDetails.poolNumber));

          delete req.session.errors;
          delete req.session.fields;

          app.logger.info('Fetched available pools for reassigning a juror', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              response,
              court,
            },
          });

          if (typeof req.session.poolJurorsReassign !== 'undefined') {
            postUrl = app.namedRoutes.build('pool-management.reassign.post', {
              poolNumber: req.params['poolNumber']});
            cancelUrl = app.namedRoutes.build('pool-overview.get', {
              poolNumber: req.params['poolNumber']});
            changeCourtUrl = app.namedRoutes.build('pool-management.reassign.select-court.get', {
              poolNumber: req.params['poolNumber']});
          } else {
            postUrl = app.namedRoutes.build('juror-management.reassign.post', {
              jurorNumber: req.params['jurorNumber']});
            cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber']});
            changeCourtUrl = app.namedRoutes.build('juror-management.reassign.select-court.get', {
              jurorNumber: req.params['jurorNumber']});
          }

          if (typeof req.session.processLateSummons !== 'undefined') {
            cancelUrl = req.session.processLateSummons.cancelUrl;
          }

          return res.render('juror-management/reassign/pools', {
            jurorNumber: req.session.poolJurorsReassign ?
              req.session.poolJurorsReassign.selectedJurors : req.params['jurorNumber'],
            pools: filteredPools,
            postUrl: postUrl,
            cancelUrl: cancelUrl,
            changeCourtUrl: changeCourtUrl,
            court,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch available pools for reassigning a juror', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            locationCode: req.session.locCode,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        };

      req.session.receivingCourtLocCode =
        typeof req.session.receivingCourtLocCode === 'undefined'
          ? req.session.locCode : req.session.receivingCourtLocCode;

      if (typeof req.session.courtsList === 'undefined') {
        let { courts } = await requestCourtsObj.get(require('request-promise'), app, req.session.authToken);

        req.session.courtsList = courts;
      }

      return requestObj
        .availablePools
        .get(require('request-promise'), app, req.session.authToken, req.session.receivingCourtLocCode)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getChangeCourt = function(app) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , submitUrl
        , cancelUrl
        , transferUrl
        , currentApp;

      delete req.session.errors;

      if (req.session.poolJurorsReassign) {
        submitUrl = app.namedRoutes.build('pool-management.reassign.select-court.post', {
          poolNumber: req.params['poolNumber'],
        });
        cancelUrl = app.namedRoutes.build('pool-management.reassign.get', {
          poolNumber: req.params['poolNumber'],
        });
        currentApp = 'Pool management';
      } else {
        submitUrl = app.namedRoutes.build('juror-management.reassign.select-court.post', {
          jurorNumber: req.params['jurorNumber'],
        });
        cancelUrl = app.namedRoutes.build('juror-management.reassign.get', {
          jurorNumber: req.params['jurorNumber'],
        });
        transferUrl = app.namedRoutes.build('juror.update.transfer.get', {
          jurorNumber: req.params['jurorNumber'],
        });
        currentApp = 'Juror management';
      };

      if (isCourtUser(req)) {
        let courts = req.session.courtsList.reduce((prev, { locationCode, locationName }) => {
          prev.push({
            value: locationCode,
            text: `${capitalizeFully(locationName)} (${locationCode})`,
          });
          return prev;
        }, []);

        return res.render('juror-management/reassign/select-court', {
          submitUrl,
          cancelUrl,
          transferUrl,
          courts,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      }

      return res.render('pool-management/_common/select-court', {
        currentApp: currentApp,
        submitUrl: submitUrl,
        cancelUrl: cancelUrl,
        pageIdentifier: 'Reassign jurors',
        pageTitle: 'Select a court to reassign to',
        courts: modUtils.transformCourtNames(req.session.courtsList),
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postChangeCourt = function(app) {
    return function(req, res) {
      var locationCode = modUtils.getLocCodeFromCourtNameOrLocation(req.body.courtNameOrLocation);

      if (req.body.courtNameOrLocation === '' || typeof req.body.courtNameOrLocation === 'undefined') {
        req.session.errors = {
          courtNameOrLocation: [{
            ...isCourtUser(req)
              ? {
                summary: 'Select a court to reassign to',
                details: 'Select a court to reassign to',
              } : {
                summary: 'Enter a court name or location code',
                details: 'Enter a court name or location code',
              },
          }],
        };

        return req.session.poolJurorsReassign ?
          res.redirect(app.namedRoutes.build('pool-management.reassign.select-court.get', {
            poolNumber: req.params['poolNumber'],
          })) :
          res.redirect(app.namedRoutes.build('juror-management.reassign.select-court.get', {
            jurorNumber: req.params['jurorNumber'],
          }));
      }

      modUtils.matchUserCourt(req.session.courtsList, req.body)
        .then((court) => {
          app.logger.info('Matched the selected court', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              matchedCourt: court,
            },
          });

          req.session.receivingCourtLocCode = court.locationCode;

          if (req.session.poolJurorsReassign) {
            return res.redirect(app.namedRoutes.build('pool-management.reassign.get', {
              poolNumber: req.params['poolNumber'],
            }));
          }

          return res.redirect(app.namedRoutes.build('juror-management.reassign.get', {
            jurorNumber: req.session.jurorCommonDetails.jurorNumber,
          }));
        })
        .catch(() => {
          app.logger.crit('Failed to match the selected court', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              selectedCourt: req.body.courtNameOrLocation,
            },
          });

          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'This court does not exist. Please enter a name or code of an existing court',
            }],
          };

          if (req.session.poolJurorsReassign) {
            return res.redirect(app.namedRoutes.build('pool-management.reassign.select-court.get', {
              poolNumber: req.params['poolNumber'],
            }));
          }

          return res.redirect(app.namedRoutes.build('juror-management.reassign.select-court.get', {
            jurorNumber: req.params['jurorNumber'],
          }));
        });

    };
  };

  module.exports.postReassignJuror = function(app) {
    return function(req, res) {
      let validatorResult
        , validationPayload;

      validatorResult = validate(req.body, validator.selectedActivePool());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return req.session.poolJurorsReassign ?
          res.redirect(app.namedRoutes.build('pool-management.reassign.get', {
            poolNumber: req.params['poolNumber'],
          })) :
          res.redirect(app.namedRoutes.build('juror-management.reassign.get', {
            jurorNumber: req.session.jurorCommonDetails.jurorNumber,
          }));
      }

      validationPayload = {
        sourcePoolNumber: req.session.poolJurorsReassign ?
          req.session.poolJurorsReassign.poolNumber : req.session.jurorCommonDetails.poolNumber
        , sendingCourtLocCode: req.session.locCode
        , receivingPoolNumber: req.body.poolNumber
        , receivingCourtLocCode: req.body.poolNumber.substring(0, 3)
        , targetServiceStartDate: dateFilter(req.body.startDate, 'ddd DD MMM YYYY', 'YYYY-MM-DD')
        , jurorNumbers: req.session.poolJurorsReassign ?
          req.session.poolJurorsReassign.selectedJurors : [req.params['jurorNumber']],
      };

      const cancelUrl = req.session.poolJurorsReassign
        ? app.namedRoutes.build('pool-overview.get', {poolNumber: req.params['poolNumber']})
        : app.namedRoutes.build('juror-record.overview.get', {jurorNumber: req.params['jurorNumber']});
      const continueUrl = req.session.poolJurorsReassign
        ? app.namedRoutes.build('pool-management.reassign.confirm.post', {poolNumber: req.params['poolNumber']})
        : app.namedRoutes.build('juror-management.reassign.confirm.post', {jurorNumber: req.params['jurorNumber']});

      if (typeof req.session.processLateSummons !== 'undefined') {
        cancelUrl = req.session.processLateSummons.cancelUrl;
      }

      return validateMovementObj.validateMovement.put(
        require('request-promise'),
        app,
        req.session.authToken,
        validationPayload
      )
        .then((data) => {
          if (data.unavailableForMove !== null) {
            req.session.availableForMove = data.availableForMove;
            req.session.reassignValidationPayload = validationPayload;

            return res.render('pool-management/movement/bulk-validate', {
              cancelUrl: cancelUrl,
              continueUrl: continueUrl,
              problems: modUtils.buildMovementProblems(data),
            });
          }

          const reassignPayload = {
            jurorNumbers: validationPayload.jurorNumbers,
            receivingCourtLocCode: validationPayload.receivingCourtLocCode,
            receivingPoolNumber: validationPayload.receivingPoolNumber,
            sourceCourtLocCode: validationPayload.sendingCourtLocCode,
            sourcePoolNumber: validationPayload.sourcePoolNumber,
          };

          sendReassignRequest(app, req, res, reassignPayload);
        })
        .catch((err) => {
          app.logger.crit('Failed to check transfer validity: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.session.poolJurorsReassign ?
              req.session.poolJurorsReassign.selectedJurors : [req.params['jurorNumber']],
            error:
              typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        });
    };
  };

  module.exports.postConfirmReassignJuror = function(app) {
    return function(req, res) {

      const validationPayload = _.clone(req.session.reassignValidationPayload);

      delete req.session.reassignValidationPayload;

      const jurorNumbers = _.clone(req.session.availableForMove);

      delete req.session.availableForMove;

      const reassignPayload = {
        jurorNumbers: jurorNumbers,
        receivingCourtLocCode: validationPayload.receivingCourtLocCode,
        receivingPoolNumber: validationPayload.receivingPoolNumber,
        sourceCourtLocCode: validationPayload.sendingCourtLocCode,
        sourcePoolNumber: validationPayload.sourcePoolNumber,
      };

      // TODO: handle better
      // if continuing after validation would leave with no jurors to reassign, redirect without reassigning
      if (jurorNumbers.length <= 0) {
        const redirectUrl = req.session.poolJurorsReassign
          ? app.namedRoutes.build('pool-overview.get', {poolNumber: req.params['poolNumber']})
          : app.namedRoutes.build('juror-record.overview.get', {jurorNumber: req.params['jurorNumber']});

        return res.redirect(redirectUrl);
      }

      sendReassignRequest(app, req, res, reassignPayload);
    };
  };

  function sendReassignRequest(app, req, res, payload) {
    requestObj.reassignJuror
      .put(require('request-promise'), app, req.session.authToken, payload)
      .then(() => {
        req.session.locCode = req.session.receivingCourtLocCode;
        delete req.session.receivingCourtLocCode;
        delete req.session.processLateSummons;

        let poolUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber: payload.receivingPoolNumber,
        });

        req.session.bannerMessage = req.session.poolJurorsReassign ?
        // eslint-disable-next-line
          `${payload.jurorNumbers.length} jurors reassigned to pool <a class="govuk-link" href="${poolUrl}">${payload.receivingPoolNumber}</a>` :
          `Reassigned to pool <a class="govuk-link" href="${poolUrl}">${payload.receivingPoolNumber}</a>`;

        if (req.session.poolJurorsReassign) {
          delete req.session.poolJurorsReassign;
          return res.redirect(app.namedRoutes.build('pool-overview.get', {
            poolNumber: payload.sourcePoolNumber,
          }));
        };
        return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.session.jurorCommonDetails.jurorNumber,
        }));
      })
      .catch((err) => {
        app.logger.crit('Failed to reassign the juror to a different pool', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            juror: req.session.poolJurorsReassign ?
              req.session.poolJurorsReassign.selectedJurors : [req.params['jurorNumber']],
            newPool: req.body.poolNumber,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic');
      });
  }

})();
