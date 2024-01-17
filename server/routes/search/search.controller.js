;(function(){
  'use strict';

  var _ = require('lodash')
    , staffRosterObj = require('../../objects/staff-roster').object
    , searchHelper = require('../../lib/utils').searchResponses
    , validate = require('validate.js');

  module.exports.index = function(app) {
    return function(req, res) {

      var tmpErrors
        , promiseArr = []
        , searchParams = false

        , successCB = function(response) {
          var searchResponse
            , staffListResponse;

          staffListResponse = null;
          searchResponse = null;

          if (_.isArray(response[0])){
            staffListResponse = response[0];
            searchResponse = response[1];
          } else {
            staffListResponse = response[1];
            searchResponse = response[0];
          }

          app.logger.info('Fetched list of staff for search filter: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            response: staffListResponse,
          });

          req.session.sourceUrl = req.path;


          // Only process search response if a search was executed
          if (searchParams){

            if (typeof searchResponse === 'undefined' || (typeof response.status !== 'undefined' && response.status === 500)) {
              app.logger.crit('Failed to fetch search results: ', {
                auth: req.session.authentication,
                jwt: req.session.authToken,
                data: {
                  params: typeof searchResponse !== 'undefined' && typeof searchResponse.searchParams !== 'undefined' ?
                    searchResponse.searchParams :
                    null,
                },
                error: (typeof response.error !== 'undefined') ? response.error : response.toString(),
              });
  
              return res.render('search/index');
            }
  
            req.session.searchResponse = searchResponse;
  
            app.logger.info('Fetched search results: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                params: typeof searchResponse.searchParams !== 'undefined' ? searchResponse.searchParams : null,
              },
              response: response,
            });
  
            if (searchResponse.searchParams.status !== null) {
              searchResponse.searchParams = _.merge(searchResponse.searchParams, {
                isTodo: searchResponse.searchParams.status.indexOf('TODO') !== -1,
                isAwaitingContact: searchResponse.searchParams.status.indexOf('AWAITING_CONTACT') !== -1,
                isAwaitingTranslation: searchResponse.searchParams.status.indexOf('AWAITING_TRANSLATION') !== -1,
                isAwaitingCourtReply: searchResponse.searchParams.status.indexOf('AWAITING_COURT_REPLY') !== -1,
                isClosed: searchResponse.searchParams.status.indexOf('CLOSED') !== -1,
              });
            }

          }

          return res.render('search/index', _.merge(req.session.searchResponse, {
            staffList: staffListResponse,
            errors: {
              message: '',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          }));
        }

        , errorCB = function(err) {
          app.logger.crit('Failed to fetch data for search page load: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('search/index');
        };

      tmpErrors = _.cloneDeep(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      // Make sure the nav session exists
      if (typeof req.session.nav === 'undefined') {
        req.session.nav = {};
      };

      // Set session nav marker for back link
      req.session.nav['lastPage'] = 'search';

      promiseArr = [];

      if (req.session.authentication.staff !== null && req.session.authentication.staff.rank > 0) {
        promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken))
      }

      searchParams = false;
      if (req.session.searchResponse) {
        if (req.session.searchResponse.searchParams) {
          promiseArr.push(searchHelper(req, app, req.session.searchResponse.searchParams));
          searchParams = true
        }
      }

      if (promiseArr.length > 0) {
        Promise.all(promiseArr)
          .then(successCB)
          .catch(errorCB);
      } else {
        return res.render('search/index', _.merge(req.session.searchResponse, {
          staffList: [],
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          }
        }));
      }

    };
  };

  module.exports.search = function(app) {
    return function(req, res) {
      var promiseArr = []
        , staffListResponse
        , searchResponse
        , isAjaxRequest = req.xhr
        , validatorResult

        , searchResponseCB = function(values) {
          searchResponse = _.isArray(values) ? values[0] : values;
          staffListResponse = _.isArray(values) ? values[1]: null;

          // Handle bad error
          // eslint-disable-next-line max-len
          if (typeof searchResponse === 'undefined' || (typeof values.status !== 'undefined' && values.status === 500)) {
            app.logger.crit('Failed to fetch search results: ', {
              auth: req.session.authentication,
              jwt: req.session.authToken,
              data: {
                params: typeof searchResponse !== 'undefined' && typeof searchResponse.searchParams !== 'undefined' ?
                  searchResponse.searchParams :
                  null,
              },
              error: (typeof values.error !== 'undefined') ? values.error : values.toString(),
            });

            return res.render('search/index');
          }

          req.session.searchResponse = searchResponse;

          app.logger.info('Fetched search results: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              params: typeof searchResponse.searchParams !== 'undefined' ? searchResponse.searchParams : null,
            },
            response: values,
          });

          if (searchResponse.searchParams.status !== null) {
            searchResponse.searchParams = _.merge(searchResponse.searchParams, {
              isTodo: searchResponse.searchParams.status.indexOf('TODO') !== -1,
              isAwaitingContact: searchResponse.searchParams.status.indexOf('AWAITING_CONTACT') !== -1,
              isAwaitingTranslation: searchResponse.searchParams.status.indexOf('AWAITING_TRANSLATION') !== -1,
              isAwaitingCourtReply: searchResponse.searchParams.status.indexOf('AWAITING_COURT_REPLY') !== -1,
              isClosed: searchResponse.searchParams.status.indexOf('CLOSED') !== -1,
            });
          }

          if (isAjaxRequest) {
            if (searchResponse.status >= 100 && searchResponse.status <= 600) {
              return res.status(searchResponse.status).send(_.merge(searchResponse, {
                isTeamLeader: req.session.authentication.staff.rank > 0,
              }));
            }

            return res.status(500).send(searchResponse);
          }

          return res.render('search/index', _.merge(searchResponse, {
            staffList: typeof staffListResponse !== 'undefined' ? staffListResponse : [],
          }));
        };

      delete req.session.errors;
      delete req.session.formFields;

      // Validate search parameters
      validatorResult = validate(req.body, require('../../config/validation/search.js')(req));
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        if (req.session.searchResponse){
          initSearchParams(req);
          delete req.session.searchResponse['results'];
        }

        //return res.status(400).json(validatorResult);
        return res.redirect(app.namedRoutes.build('search.get', {id: req.body.jurorNumber}));
      }

      //promiseArr.push(searchHelperOLD(req, app));
      promiseArr.push(searchHelper(req, app, req.body));
      if (req.session.authentication.staff.rank > 0) {
        promiseArr.push(staffRosterObj.get(require('request-promise'), app, req.session.authToken));
      }

      Promise.all(promiseArr)
        .then(searchResponseCB)
        .catch(searchResponseCB);
    };
  };

  module.exports.searchClear = function(app) {
    return function(req, res) {

      delete req.session.searchResponse;

      return res.redirect(app.namedRoutes.build('search.get'));

    };
  };

  function initSearchParams(req) {

    req.session.searchResponse['searchParams'] = {
      courtCode: null,
      jurorNumber: null,
      lastName: null,
      poolNumber: null,
      postCode: null,
      staffAssigned: null,
      status: null,
      urgentsOnly: false
    }

  }

})();

