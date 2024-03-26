(() => {
  'use strict';

  var _ = require('lodash'),
    validate = require('validate.js'),
    filters = require('../../../components/filters'),
    jurorTransferValidator = require('../../../config/validation/juror-transfer'),
    jurorBulkTransferValidator = require('../../../config/validation/juror-bulk-transfer'),
    modUtils = require('../../../lib/mod-utils'),
    { dateFilter } = require('../../../components/filters'),
    fetchAllCourts = require('../../../objects/request-pool').fetchAllCourts,
    validateMovementObj = require('../../../objects/pool-management').validateMovement;

  // TODO This controller is used both for single and bulk transfers
  module.exports.getCourtTransfer = function(app) {
    return function(req, res) {
      var successCB = function(data) {
          var processUrl, cancelUrl, tmpFields, tmpErrors;
          const bulkUpdate = typeof req.params.poolNumber !== 'undefined';

          tmpErrors = _.cloneDeep(req.session.errors);
          tmpFields = _.cloneDeep(req.session.formFields);
          delete req.session.errors;
          delete req.session.formField;

          if (bulkUpdate) {
            processUrl = app.namedRoutes.build(
              'pool-overview.transfer.select-court.post',
              { poolNumber: req.params.poolNumber },
            );
            cancelUrl = app.namedRoutes.build('pool-overview.get', {
              poolNumber: req.params.poolNumber,
            });
          } else {
            processUrl = app.namedRoutes.build('juror.update.transfer.post', {
              jurorNumber: req.params['jurorNumber'],
            });
            cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
              jurorNumber: req.params['jurorNumber'],
            });
          }

          const today = new Date();
          const minAttendanceDate = `${ today.getDate() }/${ today.getMonth() + 1 }/${ today.getFullYear() }`;
          const maxAttendanceDate = `${ today.getDate() }/${ today.getMonth() + 1 }/${ today.getFullYear() + 1 }`;
          const defaultAttendanceDate = tmpFields && tmpFields.attendanceDate || '';

          req.session.filteredCourts = data.courts.filter((court) =>
            (court.owner !== req.session.authentication.owner));

          return res.render('juror-management/transfer-court.njk', {
            bulkUpdate,
            jurorNumber: req.params.jurorNumber,
            processUrl,
            cancelUrl,
            formFields: tmpFields,
            defaultAttendanceDate,
            minAttendanceDate,
            maxAttendanceDate,
            courts: modUtils.transformCourtNames(req.session.filteredCourts),
            errors: {
              message: '',
              count:
                typeof tmpErrors !== 'undefined'
                  ? Object.keys(tmpErrors).length
                  : 0,
              items: tmpErrors,
            },
          });
        },
        errorCB = function(err) {
          app.logger.crit('Failed to fetch courts list: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            jurorNumber: req.params['jurorNumber'],
            error:
              typeof err.error !== 'undefined' ? err.error : err.toString(),
          });
          return res.render('_errors/generic');
        };

      fetchAllCourts
        .get(require('request-promise'), app, req.session.authToken)
        .then(successCB)
        .catch(errorCB);
    };
  };

  // TODO This controller is used both for single and bulk transfers
  module.exports.getCourtTransferConfirm = function(app) {
    return function(req, res) {
      var processUrl, cancelUrl;
      const bulkUpdate = typeof req.params.poolNumber !== 'undefined';

      if (bulkUpdate) {
        processUrl = app.namedRoutes.build(
          'pool-overview.transfer.confirm.post',
          { poolNumber: req.params.poolNumber },
        );
        cancelUrl = app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params.poolNumber,
        });
      } else {
        processUrl = app.namedRoutes.build('juror.update.transfer_confirm.post', {
          jurorNumber: req.params['jurorNumber'],
        });
        cancelUrl = app.namedRoutes.build('juror-record.overview.get', {
          jurorNumber: req.params['jurorNumber'],
        });
      }

      return res.render('juror-management/transfer-court-confirm.njk', {
        bulkUpdate,
        jurorNumber: req.params.jurorNumber,
        receivingCourt: req.session.formField.courtNameOrLocation,
        processUrl,
        cancelUrl,
      });
    };
  };

  // TODO This controller is used both for single and bulk transfers
  module.exports.postCourtTransfer = function(app) {
    return function(req, res) {
      var validatorResult, successUrl, failUrl, continueUrl, movementValidateRoute;

      if (typeof req.params.poolNumber === 'undefined') {
        successUrl = app.namedRoutes.build('juror.update.transfer_confirm.get', {
          jurorNumber: req.params.jurorNumber,
        });
        failUrl = app.namedRoutes.build('juror.update.transfer.get', {
          jurorNumber: req.params.jurorNumber,
        });
        req.body.jurorDetails = req.session.jurorUpdate;
        validatorResult = validate(req.body, jurorTransferValidator());
        req.body.selectedJurors = [req.params.jurorNumber];
        movementValidateRoute = 'pool-management/movement/individual-validate.njk';
      } else {
        successUrl = app.namedRoutes.build('pool-overview.transfer.confirm.get', {
          poolNumber: req.params.poolNumber,
        });
        failUrl = app.namedRoutes.build('pool-overview.transfer.select-court.get', {
          poolNumber: req.params.poolNumber,
        });
        continueUrl = app.namedRoutes.build('pool-overview.transfer.continue.post', {
          poolNumber: req.params.poolNumber,
        });
        req.body.selectedJurors = req.session.poolJurorsTransfer.selectedJurors;
        validatorResult = validate(req.body, jurorBulkTransferValidator());
        movementValidateRoute = 'pool-management/movement/bulk-validate.njk';
      }

      req.session.formField = _.clone(req.body);

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(failUrl);
      }

      modUtils.matchUserCourt(req.session.filteredCourts, req.body)
        .then((court) => {
          app.logger.info('Matched the selected court', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              matchedCourt: court,
            },
          });

          // eslint-disable-next-line max-len
          req.session.formField.courtNameOrLocation = filters.capitalizeFully(court.locationName + ' (' + court.locationCode + ')');

          validateMovementObj.validateMovement.put(require('request-promise'), app, req.session.authToken, {
            sourcePoolNumber: req.params.poolNumber || req.session.jurorUpdate.poolNumber,
            sendingCourtLocCode: resolveLocationCode(req),
            receivingCourtLocCode: modUtils.getLocCodeFromCourtNameOrLocation(req.body.courtNameOrLocation),
            targetServiceStartDate: dateFilter(req.body.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
            jurorNumbers: req.body.selectedJurors,
          })
            .then((data) => {
              delete req.session.filteredCourts;

              if (data.unavailableForMove != null) {
                req.session.availableForMove = data.availableForMove;

                return res.render(movementValidateRoute, {
                  cancelUrl: failUrl,
                  continueUrl: continueUrl,
                  problems: modUtils.buildMovementProblems(data),
                });
              }

              return res.redirect(successUrl);
            })
            .catch((err) => {
              app.logger.crit('Failed to check transfer validity: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                jurorNumber: req.params['jurorNumber'],
                error:
                  typeof err.error !== 'undefined' ? err.error : err.toString(),
              });

              delete req.session.filteredCourts;

              return res.render('_errors/generic');
            });
        })
        .catch((err) => {
          app.logger.crit('Failed to match the selected court', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              selectedCourt: req.body.courtNameOrLocation,
            },
            error:
              typeof err.error !== 'undefined' ? err.error : err.toString(),
          });

          req.session.errors = {
            courtNameOrLocation: [{
              summary: 'Please check the court name or location',
              details: 'This court does not exist. Please enter a name or code of an existing court',
            }],
          };

          return res.redirect(failUrl);
        });
    };
  };

  function resolveLocationCode(req) {
    if (typeof req.params.poolNumber === 'undefined') {
      return req.session.locCode;
    }

    return req.session.poolDetails.poolDetails.locCode;
  }
})();
