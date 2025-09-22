(function() {
  'use strict';

  var _ = require('lodash')
    , validate = require('validate.js')
    , modUtils = require('../../lib/mod-utils')
    , { poolRequestsDAO } = require('../../objects/pool-list')
    , poolTypeSelectValidator = require('../../config/validation/pool-create-select')
    , { fetchCourtsDAO } = require('../../objects/index')
    , { isCourtUser } = require('../../components/auth/user-type');

  module.exports.index = function(app) {
    return function(req, res) {
      var promiseArr = []
        , status = req.query['status'] || 'requested'
        , tab = req.query['tab']
        , page = req.query['page'] || 1
        , { sortBy, sortOrder } = req.query
        , deletedRecord
        , newPoolCreated
        , pageItems
        , pageUrls
        , successCB = function(data) {
          const listToRender = modUtils.transformPoolList(data[0].data, status, tab, sortBy, sortOrder);

          // previously we only cached if it wasn't cached already but there was problems
          // to avoid those we need to fetch and cache every time
          // does not affect performance or anything
          req.session.courtsList = data[1].courts;

          app.logger.info('Fetched pool list', {
            auth: req.session.authentication,
            data: {
              status: modUtils.poolStatus[status],
              pools: data[0],
            },
          });

          // for the moment we only paginate through the active pools list
          // the status === created is just because we haven't still
          // ... implemented pagination on the 'requested' endpoint
          if (data[0].total_items > modUtils.constants.PAGE_SIZE) {
            pageItems = modUtils.paginationBuilder(data[0].total_items, page, req.url);
          }

          pageUrls = {
            requested: urlBuilder(app, req.query, { status: 'requested', clearSort: true }),
            created: urlBuilder(app, req.query, { status: 'created', clearSort: true }),
            withTheBureau: urlBuilder(app, req.query, { tab: 'bureau', clearSort: true }),
            atCourt: urlBuilder(app, req.query, { tab: 'court', clearSort: true }),
            clearFilter: urlBuilder(app, req.query, { clearFilter: true }),
          };

          return res.render('pool-management/index', {
            poolList: listToRender,
            poolStatus: status,
            tab: tab,
            deletedRecord: deletedRecord,
            newPoolCreated: newPoolCreated,
            pageItems: pageItems,
            displayPoolManagementActionsButtonMenu: status === 'requested',
            pageUrls: pageUrls,
            locCode: req.query['location_code'],
            courts: modUtils.transformCourtNames(req.session.courtsList),
            bannerMessage,
          });
        }
        , errorCB = function(err) {
          app.logger.crit('Failed to fetch the pool list: ', {
            auth: req.session.authentication,
            data: {
              poolStatus: status,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('pool-management/index');
        };

      if (typeof req.session.deletedRecord !== 'undefined') {
        deletedRecord = _.clone(req.session.deletedRecord);
      }
      if (typeof req.session.newPoolCreated !== 'undefined') {
        newPoolCreated = _.clone(req.session.newPoolCreated);
      }

      let bannerMessage;
      if (typeof req.session.bannerMessage !== 'undefined') {
        bannerMessage = req.session.bannerMessage;
      }
      delete req.session.bannerMessage;

      exports.clearPoolManagementSessionData(app, req);

      if (status !== 'requested') {
        if (!tab && isCourtUser(req)) {
          tab = 'court';
        } else if (!tab && !isCourtUser(req)) {
          tab = 'bureau';
        }
      }

      promiseArr.push(poolRequestsDAO.get(req, {
        status: status,
        tab: tab,
        page: page,
        locCode: req.query['location_code'],
        sortBy,
        sortOrder,
      }));
      // this can later be replaced by a "in memory" cached version of the courts list
      // having this stored in a memory ds/db can make faster reads and improves our code
      // because we do not have to rely in the session data anymore
      promiseArr.push(fetchCourtsDAO.get(req));
      Promise.all(promiseArr)
        .then(successCB)
        .catch(errorCB);
    };
  };

  module.exports.filterPools = function(app) {
    return function(req, res) {
      var queryParams = _.clone(req.query);

      if (req.body.courtNameOrLocation === '' || typeof req.body.courtNameOrLocation === 'undefined') {
        // this piece will clear the filter but keep all other search params
        delete queryParams['location_code'];
        return res.redirect(urlBuilder(app, queryParams));
      }

      modUtils.matchUserCourt(req.session.courtsList, req.body)
        .then(function(court) {
          queryParams['location_code'] = court.locationCode;
          return res.redirect(urlBuilder(app, queryParams));
        })
        .catch(function() {
          delete queryParams['location_code'];
          return res.redirect(urlBuilder(app, queryParams));
        });
    };
  };

  module.exports.getPoolCreateSelect = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const formFields = _.clone(req.session.poolCreateFormFields);

      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.poolCreateFormFields;
      delete req.session.courtChange;

      res.render('pool-management/pool-create-select.njk', {
        postUrl: app.namedRoutes.build('pool-create-select.post'),
        cancelUrl: app.namedRoutes.build('pool-management.get'),
        formFields: formFields,
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postPoolCreateSelect = function(app) {
    return function(req, res) {
      const postPaths = {
        request: 'request-pool.select-court.get',
        coroner: 'coroner-pool.select-court.get',
        court: 'court-only-pool.get',
      };
      const validatorResult = validate(req.body, poolTypeSelectValidator());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-create-select.get'));
      }

      req.session.poolCreateFormFields = {
        poolTypeSelect: req.body.poolCreateSelect,
      };

      if (req.body.poolCreateSelect === 'nil') {
        return res.redirect(app.namedRoutes.build('request-pool.select-court.get')  + '?nil=true');
      };

      return res.redirect(app.namedRoutes.build(postPaths[req.body.poolCreateSelect]));
    };
  };

  module.exports.clearPoolManagementSessionData = function(app, req) {

      // clear session data
      delete req.session.deletedRecord;
      delete req.session.newPoolCreated;
      delete req.session.poolDetails;
      delete req.session.errors;
      delete req.session.formFields;
      delete req.session.hasStartedNilPool;
      delete req.session.searchPoolList;
      // clear the session.newPoolNumber data to be clean for the next pool request
      delete req.session.newPoolNumber;
      delete req.session.coronerCourt;
      delete req.session.poolCreateFormFields;
      delete req.session.courtChange;
      delete req.session.selectedDismissalPools;
      delete req.session.dismissJurors;
      
      // for backward compatibility
      delete req.session.selectedJurors;
      delete req.session.selectAll;

  };

  function urlBuilder(app, params, options) {
    var paramsClone = _.clone(params);

    if (typeof options !== 'undefined') {
      if (options.hasOwnProperty('tab')) {
        paramsClone.tab = options.tab;
      }

      if (options.hasOwnProperty('status')) {
        if (options.status === 'requested') {
          delete paramsClone.tab;
        }
        paramsClone.status = options.status;

        delete paramsClone['page'];
      }

      if (options.clearFilter) {
        delete paramsClone['location_code'];
      }

      if (options.clearSort) {
        delete paramsClone['sortBy'];
        delete paramsClone['sortOrder'];
      }
    }

    return app.namedRoutes.build('pool-management.get')
      + '?' + new URLSearchParams(paramsClone).toString();
  }

})();
