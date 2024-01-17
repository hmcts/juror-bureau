(function() {
  'use strict';

  var _ = require('lodash')
    , rp = require('request-promise')
    , { isBureauUser, isCourtUser } = require('../../../components/auth/user-type')
    , modUtils = require('../../../lib/mod-utils')
    , validator = require('../../../config/validation/pool-management').deferralMaintenance
    , validate = require('validate.js')
    , requestObj = require('../../../objects/pool-management').deferralMaintenance
    , dateFilter = require('../../../components/filters').dateFilter;

  function successCB(data, courtCode) {
    return function(app, req, res) {
      var court = req.session.courtsList.find((element) => {
        return element.locationCode === courtCode
      });

      req.session.deferralMaintenance = {
        deferrals: data.deferrals,
        court,
      };

      // set the location code in case a user visits the juror record... should be reset every time
      req.session.locCode = court.locationCode;

      app.logger.info('Fetched the deferrals available: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          deferrals: data.deferrals.length,
          courtCode,
        },
      });

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
        locationCode: court.locationCode,
      }));
    }
  }

  function errorCB(err) {
    return function(app, req, res) {
      req.session.errors = {
        deferrals: [{
          summary: 'Failed to fetch deferrals',
          details: 'Failed to fetch deferrals',
        }],
      };

      app.logger.crit('Failed to fetch deferrals: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          courtCode: req.params['locationCode'],
        },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
    }
  }

  module.exports.index = function(app) {
    return function(req, res) {
      // start by resetting the deferral maintenance data
      delete req.session.deferralMaintenance;

      if (isCourtUser(req) && !req.session.errors) {
        return requestObj
          .deferrals.get(rp, app, req.session.authToken, req.session.authentication.owner)
          .then((data) => successCB(data, req.session.authentication.owner)(app, req, res))
          .catch((err) => errorCB(err)(app, req, res));
      }

      return render()(req, res);
    }
  }

  module.exports.getDeferrals = function(app) {
    return function(req, res) {
      var validatorResult
        , courtCode;

      validatorResult = validate(req.body, validator.courtNameOrLocation());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
      }

      // this will return an array of codes (1 only) or null
      courtCode = req.body.courtNameOrLocationCode.match(/\d+/g);
      if (!courtCode || !courtCode.length) {
        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.get'));
      }

      return requestObj
        .deferrals.get(rp, app, req.session.authToken, courtCode)
        .then((data) => successCB(data, courtCode[0])(app, req, res))
        .catch((err) => errorCB(err)(app, req, res));
    }
  }

  module.exports.postFilterDeferrals = function(app) {
    return function(req, res) {
      var data = {
          court: req.session.deferralMaintenance.court,
          deferrals: req.session.deferralMaintenance.deferrals,
          filters: {},
        }
        , currentPage = req.query['page'] || 1
        , offset = 0
        , filters = _.clone(req.body);

      req.session.deferralMaintenance.filtered = [];
      delete filters._csrf;

      app.logger.info('Filtering deferrals: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          filters,
        },
      });

      // TODO: refactor this gibberish
      if (filters.jurorNumber) {
        data.filters.jurorNumber = filters.jurorNumber;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.jurorNumber === filters.jurorNumber.trim();
        });
      }

      if (filters.firstName) {
        data.filters.firstName = filters.firstName;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.firstName.toLowerCase() === filters.firstName.trim().toLowerCase();
        });
      }

      if (filters.lastName) {
        data.filters.lastName = filters.lastName;
        data.deferrals = data.deferrals.filter((deferral) => {
          return deferral.lastName.toLowerCase() === filters.lastName.trim().toLowerCase();
        });
      }

      if (filters.deferredTo) {
        data.filters.deferredTo = filters.deferredTo;
        data.deferrals = data.deferrals.filter((deferral) => {
          return dateFilter(new Date(deferral.deferredTo), null, 'DD/MM/YYYY') === filters.deferredTo;
        });
      }

      data.queryTotal = data.deferrals.length;

      if (currentPage > 1) {
        offset = modUtils.constants.PAGE_SIZE * (currentPage - 1);
      }

      if (data.queryTotal > modUtils.constants.PAGE_SIZE) {
        data.deferrals = data.deferrals.slice(offset, offset + modUtils.constants.PAGE_SIZE);
      }

      // if we have filters, we then store the filtered deferrals because we need them
      const filterLength = Object.entries(data.filters).length;
      if (filterLength > 0) {
        req.session.deferralMaintenance.filtered =
          data.deferrals.reduce((prev, curr) => {
            prev.push(curr.jurorNumber);
            return prev;
          }, []);
      }

      return render(data, !!Object.entries(data.filters).length)(req, res);
    }
  }

  module.exports.getCheckDeferral = function(app) {
    return function(req, res) {
      var juror, total;

      if (req.params.jurorNumber === 'all') {
        if (req.query['isFiltered'] === 'true') {
          req.session.deferralMaintenance.deferrals.forEach((deferral) => {
            if (req.session.deferralMaintenance.filtered.includes(deferral.jurorNumber)) {
              deferral.isChecked = req.query['check'] === 'true';
            }
          });
        } else {
          req.session.deferralMaintenance.deferrals.forEach((deferral) => {
            deferral.isChecked = req.query['check'] === 'true';
          });
        }

        total = req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length;

        return res.status(200).send({ isChecked: 'all', total });
      }

      juror = req.session.deferralMaintenance.deferrals.find((deferral) => {
        return deferral.jurorNumber === req.params['jurorNumber'];
      });
      juror.isChecked = !juror.isChecked;

      app.logger.debug('Checked or unchecked a deferral', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          deferral: juror.jurorNumber,
          checked: juror.isChecked,
        },
      });

      total = req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length;

      return res.status(200).send({ jurorNumber: req.params['jurorNumber'], isChecked: juror.isChecked, total });
    }
  }

  module.exports.getProcessCheckedDeferrals = function(app) {
    return function(req, res) {
      var deferralsToProcess
        , processSuccessCB = function(data) {
          var tmpErrors = _.clone(req.session.errors);

          delete req.session.errors;

          app.logger.info('Fetched available pools: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              pools: data.deferralPoolsSummary[0].deferralOptions,
              courtCode: req.params['locationCode'],
            },
          });

          const sortedPools = data.deferralPoolsSummary[0].deferralOptions.sort(function(a,b){
            return new Date(a.serviceStartDate) - new Date(b.serviceStartDate);
          });

          return res.render('pool-management/deferral-maintenance/pools.njk', {
            locationCode: req.params['locationCode'],
            pools: sortedPools,
            errors: {
              title: 'There is a problem',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        }
        , processErrorCB = function() {

          req.session.errors = {
            deferrals: [{
              summary: 'Failed to fetch available pools',
              details: 'Failed to fetch available pools',
            }],
          };

          app.logger.crit('Failed to fetch available pools: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              courtCode: req.params['locationCode'],
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
            locationCode: req.params['locationCode'],
          }));
        };

      deferralsToProcess = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals);

      if (!deferralsToProcess || !deferralsToProcess.length) {
        req.session.errors = {
          deferrals: [{
            summary: 'Select the deferrals you want to add to a pool',
            details: 'Select the deferrals you want to add to a pool',
          }],
        };

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintenance.filter.get', {
          locationCode: req.params['locationCode'],
        }));
      }

      return requestObj
        .availablePools.get(rp, app, req.session.authToken, req.params['locationCode'])
        .then(processSuccessCB)
        .catch(processErrorCB);
    }
  }

  module.exports.postProcessCheckedDeferrals = function(app) {
    return function(req, res) {
      var validatorResult
        , deferralsToProcess
        , processSuccessCB = function() {
          var courtCode = req.params['locationCode']
            , poolUrl = app.namedRoutes.build('pool-overview.get', {
              poolNumber: req.body.poolNumber,
            });

          delete req.session.deferralMaintenance;

          req.session.bannerMessage
            = `Selected jurors added to pool <a href="${poolUrl}" class="govuk-link">${req.body.poolNumber}</a>`;

          app.logger.info('Finished processing all selected deferrals: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              deferrals: deferralsToProcess,
              poolNumber: req.body.poolNumber,
            },
          });

          return requestObj
            .deferrals.get(rp, app, req.session.authToken, courtCode)
            .then((data) => successCB(data, courtCode)(app, req, res))
            // eslint-disable-next-line no-use-before-define
            .catch((err) => errorCB(err)(app, req, res));
        }
        , processErrorCB = function(err) {

          req.session.errors = {
            deferrals: [{
              summary: 'Failed to process the selected deferrals',
              details: 'Failed to process the selected deferrals',
            }],
          };

          app.logger.crit('Failed to process the selected deferrals: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              deferrals: deferralsToProcess,
              poolNumber: req.body.poolNumber,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.redirect(app.namedRoutes.build('pool-management.deferral-maintencance.process.get', {
            locationCode: req.params['locationCode'],
          }));
        }

      validatorResult = validate(req.body, validator.selectedActivePool());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('pool-management.deferral-maintencance.process.get', {
          locationCode: req.params['locationCode'],
        }));
      }

      deferralsToProcess = extractDeferralsToProcess(req.session.deferralMaintenance.deferrals);

      return requestObj
        .allocateJurors.post(rp, app, req.session.authToken, deferralsToProcess, req.body.poolNumber)
        .then(processSuccessCB)
        .catch(processErrorCB);
    }
  }

  function render(data, isFiltered = false) {
    return function(req, res) {
      var tmpErrors = _.clone(req.session.errors)
        , renderData
        , bannerMessage = req.session.bannerMessage;

      delete req.session.bannerMessage;
      delete req.session.errors;

      if (data) {
        renderData = _.clone(data);
        renderData.court = data.court;

        renderData.count = {
          total: req.session.deferralMaintenance.deferrals.length,
          selected: req.session.deferralMaintenance.deferrals.filter((deferral) => deferral.isChecked).length,
        };

        if (data.queryTotal > modUtils.constants.PAGE_SIZE) {
          renderData.pagination =
            modUtils.paginationBuilder(data.queryTotal, req.query['page'] || 1, req.url);
        }
      }

      return res.render('pool-management/deferral-maintenance/index', {
        deferralMaintenance: true,
        isBureauUser: isBureauUser(req),
        courts: modUtils.transformCourtNames(req.session.courtsList),
        errors: {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
        data: {
          hasData: typeof data !== 'undefined',
          bannerMessage,
          ...renderData,
        },
        isFiltered,
      });
    }
  }

  /**
   *
   * @param {object} deferrals Full loaded list of deferrals
   * @returns {string[]} An array of deferral numbers
   */
  function extractDeferralsToProcess(deferrals) {
    return deferrals.reduce((deferralNumbers, deferral) => {
      if (deferral.isChecked) {
        deferralNumbers.push(deferral.jurorNumber);
      }
      return deferralNumbers;
    }, []);
  }

})();
