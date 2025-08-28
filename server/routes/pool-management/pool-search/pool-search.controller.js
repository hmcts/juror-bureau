;(function(){
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , searchPoolObj = require('../../../objects/pool-search.js').poolSearchObject
    , fetchCourts = require('../../../objects/request-pool').fetchCourts
    , searchValidator = require('../../../config/validation/pool-search')
    , modUtils = require('../../../lib/mod-utils')
    , validate = require('validate.js')
    , isCourtUser = require('../../../components/auth/user-type.js').isCourtUser
    , dateFilter = require('../../../components/filters').dateFilter;

  module.exports.index = function(app) {
    return function(req, res) {
      var transformedCourtNames
        , query
        , invalidQuery
        , advancedFields
        , pageItems
        , page = req.query['page'] || 1
        , tmpErrors

        , successCB = function() {
          transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);

          advancedFields = {
            afRequested: typeof req.query['poolStatus'] !== 'undefined'
              ? req.query['poolStatus'].split(',').includes('REQUESTED')
              : false,
            afActive: typeof req.query['poolStatus'] !== 'undefined'
              ? req.query['poolStatus'].split(',').includes('ACTIVE')
              : false,
            afCompleted: typeof req.query['poolStatus'] !== 'undefined'
              ? req.query['poolStatus'].split(',').includes('COMPLETED')
              : false,
            afBureau: typeof req.query['poolStage'] !== 'undefined'
              ? req.query['poolStage'].split(',').includes('BUREAU')
              : false,
            afCourt: typeof req.query['poolStage'] !== 'undefined'
              ? req.query['poolStage'].split(',').includes('COURT')
              : false,
            afCrown: typeof req.query['poolType'] !== 'undefined'
              ? req.query['poolType'].split(',').includes('CRO')
              : false,
            afCivil: typeof req.query['poolType'] !== 'undefined'
              ? req.query['poolType'].split(',').includes('CIV')
              : false,
            afHigh: typeof req.query['poolType'] !== 'undefined'
              ? req.query['poolType'].split(',').includes('HGH')
              : false,
            afIsNilPool: typeof req.query['isNilPool'] !== 'undefined'
              ? req.query['isNilPool'] == "true"
              : false
          };

          if (req.session.formFields) {
            invalidQuery = {
              date: req.query['date'],
              poolNumber: req.query['poolNumber'],
              locCode: req.query['locCode'],
            };
          }
          if (req.session.poolSearch) {
            query = {
              poolNumber: req.query['poolNumber'],
              locCode: req.query['locCode'],
              date: req.query['date'],
            };
          }

          delete req.session.isSearch;

          if (req.session.poolSearch === 'empty') {
            delete req.session.poolSearch;
            return res.render('pool-management/pool-search/index', {
              resultsCount: 0,
              courts: transformedCourtNames,
              advancedFields,
              query: {
                locCode: req.body.courtNameOrLocation,
              },
            });
          } else if (req.session.poolSearch === 'valid') {
            delete req.session.poolSearch;
            if (req.session.poolSearchResults.resultsCount > modUtils.constants.PAGE_SIZE) {
              pageItems = modUtils.paginationBuilder(req.session.poolSearchResults.resultsCount, page, req.url);
            }

            return res.render('pool-management/pool-search/index', {
              searchPoolList: req.session.poolSearchResults.searchPoolList,
              pageItems: pageItems,
              resultsCount: req.session.poolSearchResults.resultsCount,
              courts: transformedCourtNames,
              query: query,
              advancedFields: advancedFields,
            });
          } else if (req.session.poolSearch === 'invalid') {
            delete req.session.poolSearch;

            tmpErrors = _.clone(req.session.errors);
            delete req.session.errors;
            delete req.session.formFields;

            return res.render('pool-management/pool-search/index', {
              courts: transformedCourtNames,
              advancedFields,
              errors: {
                title: 'Please check the form',
                count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
                items: tmpErrors,
              },
              query: invalidQuery,
            });
          }

          delete req.session.poolSearchResults;
          res.render('pool-management/pool-search/index', {
            courts: transformedCourtNames,
          });
        }
        , poolSearchRequest = function() {
        // Run API request
          return searchPoolObj.post(
            req,
            req.query
          )
            .then(successfulSearch(app, req, res))
            .catch(function(err) {
              var redirectUrl = app.namedRoutes.build('pool-search.get');

              app.logger.crit('Failed to do a pool search: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
              });

              req.session.isSearch = true;
              req.session.poolSearch = 'empty';
              return res.redirect(urljoin(redirectUrl, '?' + urlBuilder(req.query).join('&')));
            });
        };

      if (req.session.isSearch || Object.entries(req.query).length === 0) {
        return successCB();
      }

      // a fallback request in case the user haven't cached courts yet
      if (typeof req.session.courtsList === 'undefined') {
        return fetchCourts.get(req)
          .then(function(data) {
            req.session.courtsList = data.courts;

            return poolSearchRequest();
          });
      }

      return poolSearchRequest();
    };
  };

  module.exports.post = function(app) {
    return function(req, res) {
      var court = req.body.courtNameOrLocation
        , courtLocation = req.body.courtNameOrLocation.match(/\d+/g)
        , validatorResult
        , redirectUrl = app.namedRoutes.build('pool-search.get')
        , dateToUse
        , parameters = []

        , errorCB = function(err) {
          app.logger.crit('Failed to do a pool search: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          req.session.poolSearch = 'invalid';
          return res.redirect(urljoin(redirectUrl));
        };

      // If pool number is negative, make it absolute
      if (req.body.poolNumber < 0) {
        req.body.poolNumber = Math.abs(req.body.poolNumber);
      }

      // If date fields are not empty, set variable to false and run validator
      if (req.body.serviceStartDate !== ''
        || (req.body.poolNumber.toString().length < 3 && req.body.poolNumber !== '')
        || req.body.poolNumber.toString().length > 9
        || isNaN(req.body.poolNumber)
      ) {
        validatorResult = validate(req.body, searchValidator());

        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;
          req.session.poolSearch = 'invalid';
          if (req.body.poolNumber !== '') {
            parameters.push('poolNumber=' + req.body.poolNumber);
          }
          if (court !== '') {
            parameters.push('locCode=' + court);
          }

          req.session.isSearch = true;
          return res.redirect(urljoin(redirectUrl, '?' + parameters.join('&')));
        }
      }

      // If sanitised court location code is not empty and is length 3, set requets body location code to that
      if (courtLocation !== null && courtLocation[0].length === 3) {
        req.body.locCode = courtLocation[0];
      }

      // If all search parameters are empty, bypass API call and render result
      if (req.body.poolNumber === '' && !req.body.locCode && req.body.serviceStartDate === '') {
        req.session.poolSearch = 'empty';
        if (court !== '') {
          return res.redirect(urljoin(redirectUrl, '?' + 'locCode=' + court));
        }
        return res.redirect(redirectUrl);
      }

      // if the user is court and the searched court does not match what they are allowed just redirect to no-results
      if (isCourtUser(req, res)
        && court !== ''
        && !req.session.authentication.staff.courts.includes(courtLocation.toString())
      ) {
        req.session.poolSearch = 'empty';
        return res.redirect(redirectUrl);
      }

      // If date field is not empty, then format and set date, else set an empty string
      req.body.serviceStartDate = req.body.serviceStartDate !== ''
        ? dateFilter(req.body.serviceStartDate, 'DD/MM/YYYY', 'YYYY-MM-DD')
        : '';

      // Run API request
      return searchPoolObj.post(
        req,
        req.body
      )
        .then(successfulSearch(app, req, res))
        .catch(errorCB);
    };
  };

  function successfulSearch(app, req, res) {
    return function(data) {
      var transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList)
        , redirectUrl = app.namedRoutes.build('pool-search.get')
        , parameters;

      app.logger.info('Successfully fetched search query: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: data,
      });

      // If only 1 result, redirect to that pool
      if (data.poolRequests.length === 1) {
        return res.redirect(app.namedRoutes.build('pool-overview.get', {
          poolNumber: data.poolRequests[0].poolNumber,
        }));
      }

      req.session.searchPoolList = modUtils.transformSearchPoolList(data.poolRequests);

      req.session.poolSearchResults = {
        searchPoolList: req.session.searchPoolList,
        courtName: req.body.courtNameOrLocation,
        poolStatus: req.body.poolStatus,
        poolType: req.body.poolType,
        poolStage: req.body.poolStage,
        resultsCount: data.resultsCount,
        courts: transformedCourtNames,
      };

      if (Object.entries(req.body).length > 0) {
        parameters = urlBuilder(req.body);
      } else if (Object.entries(req.query).length > 0) {
        parameters = urlBuilder(req.query);
      }

      req.session.poolSearch = 'valid';
      req.session.isSearch = true;
      return res.redirect(urljoin(redirectUrl, '?' + parameters.join('&')));
    };
  }

  function urlBuilder(params) {
    var parameters = [];

    if (params.poolNumber) {
      parameters.push('poolNumber=' + params.poolNumber);
    }

    if (params.locCode) {
      parameters.push('locCode=' + params.locCode);
    }

    if (params.date) {
      parameters.push('date=' + params.date);
    }

    if (params.page) {
      parameters.push('page=' + params.page);
    }

    if (params.serviceStartDate) {
      parameters.push('date=' + params.serviceStartDate);
    }

    if (params.poolStatus) {
      parameters.push('poolStatus=' + params.poolStatus);
    }

    if (params.poolStage) {
      parameters.push('poolStage=' + params.poolStage);
    }

    if (params.poolType) {
      parameters.push('poolType=' + params.poolType);
    }

    if (params.isNilPool) {
      parameters.push('isNilPool=' + params.isNilPool);
    }

    return parameters;
  }

})();
