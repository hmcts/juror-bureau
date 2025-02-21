(function() {
  'use strict';

  const _ = require('lodash')
  const modUtils = require('../../../lib/mod-utils')
  const validate = require('validate.js')
  const selectCourtValidator = require('../../../config/validation/request-pool').coronerPoolSelectCourt
  const poolDetailsValidator = require('../../../config/validation/request-pool').coronerPoolDetails
  const coronerPoolPostcodes = require('../../../config/validation/request-pool').coronerPoolPostcodes
  const dateFilter = require('../../../components/filters').dateFilter
  const postCodesObject = require('../../../objects/postcodes').postCodesObject
  const poolObj = require('../../../objects/request-pool')
  const { fetchCoronerPoolDAO, createCoronerPoolDAO } = require('../../../objects');

  module.exports.getSelectCourt = function(app) {
    return function(req, res) {
      var transformedCourtNames
        , tmpErrors = _.clone(req.session.errors)
        , tmpData = _.clone(req.session.coronerCourt) || {}
        , renderFn = function(response) {

          if (response) {
            req.session.courtsList = response.courts;
            transformedCourtNames = modUtils.transformCourtNames(response.courts);
          } else {
            transformedCourtNames = modUtils.transformCourtNames(_.clone(req.session.courtsList));
          }

          return res.render('pool-management/coroner-court/select-court', {
            courts: transformedCourtNames,
            errors: {
              title: 'There is a problem',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
            jurorsRequested: tmpData.jurorsRequested,
          });
        };

      delete req.session.errors;
      delete req.session.formFields;

      if (typeof req.session.courtsList === 'undefined') {
        return poolObj.fetchCourts.get(req)
          .then(renderFn);
      }

      return renderFn(null);
    };
  };

  module.exports.postSelectCourt = function(app) {
    return function(req, res) {
      var successCB = function(court) {

          // store the selected court in the session object
          req.session.coronerCourt.selectedCourt = court;

          // we log here the matched court but we never did an api request.... its ok to just log :-)
          app.logger.info('Matched the selected court', {
            auth: req.session.authentication,
            data: {
              matchedCourt: court,
            },
          });

          return res.redirect(app.namedRoutes.build('coroner-pool.details.get'));
        }
        , errorCB = function() {

          app.logger.crit('Failed to match the selected court', {
            auth: req.session.authentication,
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

          return res.redirect(app.namedRoutes.build('coroner-pool.select-court.get'));
        }
        , validatorResult;

      if (typeof req.session.coronerCourt === 'undefined') {
        req.session.coronerCourt = {
          jurorsRequested: req.body.jurorsRequested,
        };
      } else {
        req.session.coronerCourt.jurorsRequested = req.body.jurorsRequested;
      }

      validatorResult = validate(req.body, selectCourtValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('coroner-pool.select-court.get'));
      }

      return modUtils.matchUserCourt(req.session.courtsList, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getPoolDetails = function(app) {
    return function(req, res) {
      var requestedDate
        , tmpErrors = _.clone(req.session.errors);

      delete req.session.errors;
      delete req.session.formFields;

      // we do not allow the user to navigate to this step by manually entering the url
      // .... maybe a middleware? 🤔
      if (typeof req.session.coronerCourt === 'undefined') {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      // one would say that we're only checking if requestedDate is defined so Year, Month and Day could be undefined
      // ... however, those are defined when, and always when the requestedDate is defined.
      requestedDate = (typeof req.session.coronerCourt.requestedDate === 'undefined'
        || req.session.coronerCourt.requestedDate === '')
        ? dateFilter(new Date(), null, 'DD/MM/YYYY')
        : req.session.coronerCourt.requestedDate;

      return res.render('pool-management/coroner-court/details', {
        requesterName: req.session.coronerCourt.requesterName,
        requesterEmail: req.session.coronerCourt.requesterEmail,
        requesterPhone: req.session.coronerCourt.requesterPhone,
        requestedDate,
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        backLinkUrl: 'coroner-pool.select-court.get',
      });
    };
  };

  module.exports.postPoolDetails = function(app) {
    return function(req, res) {
      var validatorResult;

      // add all new body values to the coronerCourt session object
      for (let key in req.body) {
        if (req.body.hasOwnProperty(key) && key !== '_csrf') {
          req.session.coronerCourt[key] = req.body[key];
        }
      }

      validatorResult = validate(req.body, poolDetailsValidator());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('coroner-pool.details.get'));
      }

      return res.redirect(app.namedRoutes.build('coroner-pool.check-details.get'));
    };
  };

  module.exports.getCheckDetails = function(app) {
    return function(req, res) {
      var coronerCourtPoolFailed = req.session.coronerCourtPoolFailed;

      // we do not allow the user to navigate to this step by manually entering the url
      if (typeof req.session.coronerCourt === 'undefined') {
        return res.redirect(app.namedRoutes.build('pool-management.get'));
      }

      let requestedDate = dateFilter(req.session.coronerCourt.requestedDate, 'DD/MM/YYYY', 'YYYY-MM-DD');

      delete req.session.coronerCourtPoolFailed;

      return res.render('pool-management/coroner-court/check-details', {
        requestDetails: req.session.coronerCourt,
        coronerCourtPoolFailed: coronerCourtPoolFailed,
        requestedDate,
      });
    };
  };

  module.exports.postCheckDetails = function(app) {
    return function(req, res) {
      var successCB = function(response) {
          var poolNumber = new URLSearchParams(response._headers.location).get('poolNumber');

          app.logger.info('Successfully created a coroner court', {
            auth: req.session.authentication,
            data: req.body,
          });

          delete req.session.coronerCourt;

          return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber: poolNumber }));
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to create a new coroner court pool', {
            auth: req.session.authentication,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.coronerCourtPoolFailed = true;

          return res.redirect(app.namedRoutes.build('coroner-pool.check-details.get'));
        };

      return createCoronerPoolDAO.post(req, req.body)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getCatchmentArea = function(app) {
    return function(req, res) {
      var poolDetails = _.clone(req.session.coronerCourt);

      if (typeof req.session.newCourtCatchmentArea !== 'undefined') {
        poolDetails.courtLocationCode = req.session.newCourtCatchmentArea.locationCode;
        poolDetails.courtName = req.session.newCourtCatchmentArea.locationName;
      }

      return res.render('pool-management/coroner-court/catchment-area', {
        poolDetails: poolDetails,
      });
    };
  };

  module.exports.getPostCodes = function(app) {
    return function(req, res) {
      var locationCode
        , successCB = function(response) {
          var postcodes = []
            , addCitizensError = req.session.addCitizensError
            , tmpErrors = _.clone(req.session.errors)
            , fieldErrorMessages = {}
            , maxExceededError = {};

          if (typeof response !== 'undefined' && response.CourtCatchmentItems) {

            postcodes = modUtils.transformPostcodes(response.CourtCatchmentItems)[0];

            delete req.session.errors;
            delete req.session.formFields;
            delete req.session.addCitizensError;
            req.session.coronerPostcodes = response.CourtCatchmentItems;

            if (tmpErrors) {
              tmpErrors.coronerPostcodes[0].fields.forEach(function(element, index) {
                if (element === 'limit_exceeded') {
                  maxExceededError = {
                    text: tmpErrors.coronerPostcodes[0].summary[index],
                  };
                } else {
                  fieldErrorMessages[element] = {
                    text: tmpErrors.coronerPostcodes[0].summary[index],
                  };
                }
              });
            }
          }

          return res.render('pool-management/coroner-court/postcodes', {
            poolDetails: req.session.coronerCourt,
            locationCode: locationCode,
            postCodes: postcodes,
            backLinkUrl: app.namedRoutes.build('coroner-pool.catchment-area.get', {
              poolNumber: req.session.coronerCourt.poolNumber,
            }),
            addCitizensError: addCitizensError,
            errors: {
              title: 'There is a problem',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: (tmpErrors) ? tmpErrors.coronerPostcodes : null,
            },
            fieldErrorMessages: fieldErrorMessages,
            maxExceededError: maxExceededError,
          });
        }
        , errorCB = function(err) {

          app.logger.crit('Failed to fetch pool summary: ', {
            auth: req.session.authentication,
            data: {
              poolNumber: req.session.coronerCourt.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return app.namedRoutes.build('pool-overview.get', {
            poolNumber: req.params['poolNumber'],
          });
        }
        , isCoronersPool = true;

      // we want to actually check if a new court catchment area was set in order to use that one
      // for the postcodes
      if (typeof req.session.newCourtCatchmentArea !== 'undefined') {
        locationCode = req.session.newCourtCatchmentArea.locationCode;
      } else {
        locationCode = req.session.coronerCourt.locCode;
      }

      return postCodesObject.get(
        req,
        locationCode,
        isCoronersPool
      )
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.postPostCodes = function(app) {
    return async function(req, res) {
      const successCB = function() {
        app.logger.info('Successfully added citizens into the coroner pool', {
          auth: req.session.authentication,
          data: req.body,
        });

        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: req.params['poolNumber'],
        }));
      }
      const errorCB = function(err) {
        app.logger.crit('Failed to add citizens in pool: ', {
          auth: req.session.authentication,
          data: req.body,
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        req.session.addCitizensError = true;

        return res.redirect(
          app.namedRoutes.build('coroner-pool.postcodes.get', {
            poolNumber: req.params['poolNumber'],
          })
        );
      }
      const payload = buildPayload(req.body)

      const validatorResult = validate(req.body, coronerPoolPostcodes(
        req.session.coronerPostcodes, payload.postcodeAndNumbers, req.session.coronerCourt.totalAdded
      ));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('coroner-pool.postcodes.get', {
          poolNumber: req.params['poolNumber'],
        }));
      }
      delete req.session.coronerPostcodes;

      try {
        await fetchCoronerPoolDAO.get(req, req.params['poolNumber'], req.session.coronerCourtEtag);

        delete req.session.coronerCourtEtag;

        req.session.errors = modUtils.makeManualError('coronerPool', 'Total number of jurors in this pool has been updated since you last viewed this record.');

        return res.redirect(app.namedRoutes.build('pool-overview.get', { poolNumber: req.params['poolNumber'] }));
      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when summoning to coroners court: ', {
            auth: req.session.authentication,
            data: {
              poolNumber: req.params['poolNumber']
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        }
      }

      return poolObj.addCoronerCitizens.post(req, payload)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.getExportPool = function(app) {
    return function(req, res) {
      var successCB = function(data) {
        var csvResult
          , filename
          , requestDate = dateFilter(new Date(data.dateRequested), null, 'DD/MM/YYYY');

        csvResult = data.coronerDetailsList.map((member) => {
          return [data.poolNumber, data.name, requestDate, requestDate, data.noRequested,
            Object.values(member).slice(-10).join(',')];
        });
        csvResult.unshift(['pool_no', 'coroner_name', 'request_date', 'service_date', 'no_requested'
          , 'title', 'first_name', 'last_name'
          , 'address1', 'address2', 'address3', 'address4', 'address5', 'address6', 'postcode']);
        filename = ['pool', data.poolNumber, data.dateRequested.join('-')].join('_') + '.csv';

        res.set('content-disposition', 'attachment; filename=' + filename);
        res.type('csv');
        res.send(csvResult.join('\n'));
      };

      fetchCoronerPoolDAO.get(req, req.params['poolNumber'])
        .then(successCB)
        .catch((err) => {
          app.logger.crit('Failed to export the coroner court pool', {
            auth: req.session.authentication,
            data: req.body,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(400).send();
        });
    };
  };

  function buildPayload(body) {
    var tmpBody = _.clone(body)
      , payload = {}
      , element;

    payload.locCode = tmpBody.locCode;
    payload.poolNumber = tmpBody.poolNumber;
    payload.postcodeAndNumbers = [];

    delete tmpBody._csrf;
    delete tmpBody.locCode;
    delete tmpBody.poolNumber;

    for (element in tmpBody) {
      if (tmpBody[element] !== '' && tmpBody[element] > 0) {
        payload.postcodeAndNumbers.push({
          numberToAdd: tmpBody[element],
          postcode: element,
        });
      }
    }

    return payload;
  }

})();
