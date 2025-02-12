;(function(){
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , validate = require('validate.js')
    , validator = require('../../../config/validation/request-pool')
    , modUtils = require('../../../lib/mod-utils')
    , fetchCourts = require('../../../objects/request-pool').fetchCourts
    , summoningProgressObject = require('../../../objects/summoning-progress').summoningProgressObject;

  module.exports.index = (app) => {
    return (req, res) => {
      if (req.session.isRequest || Object.entries(req.query).length === 0) {
        let invalidQuery;

        if (req.session.formFields) {
          invalidQuery = {
            locCode: req.query['locCode'],
            poolType: req.query['poolType']
          };
        }

        let query;

        if (req.session.summoningProgressRequestStatus) {
          query = {
            locCode: req.query['locCode'],
            poolType: req.query['poolType']
          };
        }

        delete req.session.isRequest;

        let transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);

        if (req.session.summoningProgressRequestStatus === 'empty') {
          delete req.session.summoningProgressRequestStatus;

          return res.render('pool-management/summoning-progress/index', {
            summoningProgressList: req.session.summoningProgressList,
            courts: transformedCourtNames,
            query: query
          });
        } else if (req.session.summoningProgressRequestStatus === 'valid') {
          delete req.session.summoningProgressRequestStatus;

          return res.render('pool-management/summoning-progress/index', {
            summoningProgressList: req.session.summoningProgressList,
            courts: transformedCourtNames,
            poolType: query.poolType,
            courtNameLong: req.session.courtNameLong,
            query: query
          });
        } else if (req.session.summoningProgressRequestStatus === 'invalid') {
          delete req.session.summoningProgressRequestStatus;

          let tmpErrors = _.clone(req.session.errors)

          delete req.session.errors;
          delete req.session.formFields;

          return res.render('pool-management/summoning-progress/index', {
            courts: transformedCourtNames,
            query: invalidQuery,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            }
          });
        }
        delete req.session.summoningProgressResults;
        return res.render('pool-management/summoning-progress/index', {
          courts: transformedCourtNames,
        });
      }

      if (typeof req.session.courtsList === 'undefined') {
        return fetchCourts.get(req)
          .then((data) => {
            req.session.courtsList = data.courts;
          })
      }
      return getSummoningProgress(app, req, res, req.query);
    }
  }

  module.exports.post = (app) => {
    return (req, res) => {
      delete req.session.errors;
      delete req.session.formFields;

      return getSummoningProgress(app, req, res, req.body);
    }
  }

  function getSummoningProgress(app, req, res, query) {
    let redirectUrl = app.namedRoutes.build('summoning-progress.get')

    if (!query.courtNameOrLocation) { // if the user has come through query params
      query.courtNameOrLocation = query.locCode;
    }

    let validatorResult = validate(query, validator.poolTypeAndCourtNameOrLocation(query));

    if (typeof validatorResult !== 'undefined') {
      req.session.errors = validatorResult;
      req.session.formFields = query;
      req.session.summoningProgressRequestStatus = 'invalid';

      let params = [];

      if (query.courtNameOrLocation) {
        params.push('locCode=' + query.courtNameOrLocation);
      }
      if (query.poolType) {
        params.push('poolType=' + query.poolType);
      }

      req.session.isRequest = true;
      return res.redirect(urljoin(redirectUrl, '?' + params.join('&')));
    }

    let locCode = modUtils.getLocCodeFromCourtNameOrLocation(query.courtNameOrLocation);

    if (locCode !== null && locCode.length === 3) {
      query.locCode = locCode;
    }

    return summoningProgressObject.get(
      req,
      query
    ).then(successfulRequest(app, req, res)
    ).catch((err) => {
      app.logger.crit('Failed to fetch summoning progress: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString()
      });

      let params;

      if (err.statusCode === 404) {
        req.session.summoningProgressList = 'notFound';
        req.session.summoningProgressRequestStatus = 'empty';
        req.session.isRequest = true;

        if (Object.entries(req.body).length > 0) {
          params = 'locCode=' + req.body.locCode + '&poolType=' + req.body.poolType;
        } else if (Object.entries(req.query).length > 0) {
          params = 'locCode=' + req.query.locCode + '&poolType=' + req.query.poolType;
        }
      } else {
        req.session.summoningProgressRequestStatus = 'invalid';
        params = 'locCode=' + req.body.locCode + '&poolType=' + req.body.poolType;
      }

      return res.redirect(urljoin(redirectUrl, '?' + params));
    });
  }

  function successfulRequest(app, req, res) {
    return (data) => {
      let redirectUrl = app.namedRoutes.build('summoning-progress.get')

      app.logger.info('Successfully fetched summoning progress: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: data,
      });

      req.session.summoningProgressList = transformSummoningProgressList(data);

      let locCode, params;

      if (Object.entries(req.body).length > 0) {
        params = 'locCode=' + req.body.locCode + '&poolType=' + req.body.poolType;
        locCode = req.body.locCode;
      } else if (Object.entries(req.query).length > 0) {
        params = 'locCode=' + req.query.locCode + '&poolType=' + req.query.poolType;
        locCode = req.query.locCode;
      }

      let courtObj = req.session.courtsList.find(court => court.locationCode === locCode);

      req.session.courtNameLong = modUtils.transformCourtName(courtObj);

      req.session.summoningProgressRequestStatus = 'valid';
      req.session.isRequest = true;

      return res.redirect(urljoin(redirectUrl, '?' + params));
    }
  }

  function transformSummoningProgressList(summoningProgressList) {
    summoningProgressList.statsByWeek.forEach(function(week) {

      week.stats.forEach(function(pool) {
        console.log('\n\n', pool, '\n\n');
        if (pool.requested !== 0) {
          pool.barChart = barChartBuilder(
            pool.summoned, // see: total jurors in 'summoned status' a.k.a not responded
            pool.unavailable,
            pool.requested,
            pool.confirmed
          );
        }
        pool.totalSummoned = pool.unavailable + pool.confirmed + pool.summoned; // total jurors SUMMONED
      });
    })
    return summoningProgressList;
  }

  function barChartBuilder(summoned, unavailable, requested, confirmed) {
    let confirmedValue, unavailableValue, requestedValue, nonRespondedValue, surplusValue;

    const totalJurorsSummoned = summoned + unavailable + confirmed;

    if (confirmed >= requested) {  // ∴ exact or surplus (surplus bar and no requested)
      unavailableValue = unavailable;
      requestedValue = 0;
      surplusValue = confirmed + summoned >= requested ? confirmed - requested : 0
      confirmedValue = confirmed - surplusValue;
      nonRespondedValue = confirmed + summoned >= requested ? totalJurorsSummoned - unavailable - confirmed : 0;    
    } else { // ∴ deficit (requested bar but no surplus)
      confirmedValue = confirmed;
      unavailableValue = unavailable;
      requestedValue = confirmed + summoned <= requested ? summoned : requested - confirmed;
      nonRespondedValue = confirmed + summoned <= requested ? 0 : totalJurorsSummoned - unavailable - confirmed - requestedValue;
      surplusValue = 0;
    }

    const requestedPct = (requestedValue / totalJurorsSummoned) * 100;
    const confirmedPct = (confirmedValue / totalJurorsSummoned) * 100;
    const unavailablePct = (unavailableValue / totalJurorsSummoned) * 100;
    const notRespondedPct = (nonRespondedValue / totalJurorsSummoned) * 100;
    const surplusPct = (surplusValue / totalJurorsSummoned) * 100;
    const trianglePosition = (requested / totalJurorsSummoned) * 100;

    return {
      confirmedValue,
      unavailableValue,
      requestedValue,
      nonRespondedValue,
      surplusValue,
      confirmed: confirmedPct,
      requested: requestedPct,
      trianglePosition: trianglePosition,
      surplus: surplusPct,
      notResponded: notRespondedPct,
      unavailable: unavailablePct,
    };
  }
})();
