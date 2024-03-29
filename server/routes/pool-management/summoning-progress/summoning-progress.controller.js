const _ = require('lodash');
const urljoin = require('url-join');
const validate = require('validate.js');
const validator = require('../../../config/validation/request-pool');
const modUtils = require('../../../lib/mod-utils');
const fetchCourts = require('../../../objects/request-pool').fetchCourts;
const summoningProgressObject = require('../../../objects/summoning-progress').summoningProgressObject;

module.exports.index = (app) => {
  return (req, res) => {
    if (req.session.isRequest || Object.entries(req.query).length === 0) {
      let invalidQuery;

      if (req.session.formFields) {
        invalidQuery = {
          locCode: req.query['locCode'],
          poolType: req.query['poolType'],
        };
      }

      let query;

      if (req.session.summoningProgressRequestStatus) {
        query = {
          locCode: req.query['locCode'],
          poolType: req.query['poolType'],
        };
      }

      delete req.session.isRequest;

      let transformedCourtNames = modUtils.transformCourtNames(req.session.courtsList);

      if (req.session.summoningProgressRequestStatus === 'empty') {
        delete req.session.summoningProgressRequestStatus;

        return res.render('pool-management/summoning-progress/index', {
          summoningProgressList: req.session.summoningProgressList,
          courts: transformedCourtNames,
          query: query,
        });
      } else if (req.session.summoningProgressRequestStatus === 'valid') {
        delete req.session.summoningProgressRequestStatus;

        return res.render('pool-management/summoning-progress/index', {
          summoningProgressList: req.session.summoningProgressList,
          courts: transformedCourtNames,
          poolType: query.poolType,
          courtNameLong: req.session.courtNameLong,
          query: query,
        });
      } else if (req.session.summoningProgressRequestStatus === 'invalid') {
        delete req.session.summoningProgressRequestStatus;

        let tmpErrors = _.clone(req.session.errors);

        delete req.session.errors;
        delete req.session.formFields;

        return res.render('pool-management/summoning-progress/index', {
          courts: transformedCourtNames,
          query: invalidQuery,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      }
      delete req.session.summoningProgressResults;
      return res.render('pool-management/summoning-progress/index', {
        courts: transformedCourtNames,
      });
    }

    if (typeof req.session.courtsList === 'undefined') {
      return fetchCourts.get(
        require('request-promise'),
        app,
        req.session.authToken,
      ).then((data) => {
        req.session.courtsList = data.courts;
      });
    }

    return getSummoningProgress(app, req, res, req.query);
  };
};

module.exports.post = (app) => {
  return (req, res) => {
    delete req.session.errors;
    delete req.session.formFields;

    return getSummoningProgress(app, req, res, req.body);
  };
};

function getSummoningProgress (app, req, res, query) {
  let redirectUrl = app.namedRoutes.build('summoning-progress.get');

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
    require('request-promise'),
    app,
    req.session.authToken,
    query,
  )
    .then(successfulRequest(app, req, res))
    .catch((err) => {
      app.logger.crit('Failed to fetch summoning progress: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
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

function successfulRequest (app, req, res) {
  return (data) => {
    let redirectUrl = app.namedRoutes.build('summoning-progress.get');

    app.logger.info('Successfully fetched summoning progress: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: data,
    });

    req.session.summoningProgressList = transformSummoningProgressList(data);

    let locCode;
    let params;

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
  };
}

function transformSummoningProgressList (summoningProgressList) {
  summoningProgressList.statsByWeek.forEach(function (week) {

    week.stats.forEach(function (pool) {
      if (pool.requested !== 0) {
        pool.barChart = barChartBuilder(
          pool.summoned, // see: total jurors in 'summoned status' a.k.a not responded
          pool.unavailable,
          pool.requested,
          pool.confirmed,
        );
      }
      pool.totalSummoned = pool.unavailable + pool.confirmed + pool.summoned; // total jurors SUMMONED
    });
  });

  return summoningProgressList;
}

function barChartBuilder (summoned, unavailable, requested, confirmed) {
  let confirmedPct;
  let requestedPct;
  let unavailablePct;
  let trianglePosition;
  let surplusPct;
  let notRespondedPct;
  let total;

  total = unavailable; // this segment always included, regardless of below conditions

  if (confirmed >= requested) {  // ∴ exact or surplus (surplus bar and no requested)
    total += confirmed + summoned; // this covers the remaining segment: blue confirmed and possible pink surplus
    requestedPct = 0;
    confirmedPct = (requested / total) * 100;
    trianglePosition = confirmedPct;
    surplusPct = ((confirmed - requested) / total) * 100;
    notRespondedPct = (summoned / total) * 100;
  } else { // ∴ deficit (requested bar but no surplus)
    total += requested + (Math.max(0, (summoned - (requested - confirmed)))); // this covers the remaining segments
    requestedPct = ((requested - confirmed) / total) * 100;
    confirmedPct = (confirmed / total) * 100;
    trianglePosition = requestedPct + confirmedPct;
    surplusPct = 0;
    notRespondedPct = (Math.max(0, (summoned - (requested - confirmed))) / total) * 100;
  }

  unavailablePct = (unavailable / total) * 100;

  return {
    confirmed: confirmedPct,
    requested: requestedPct,
    trianglePosition: trianglePosition,
    surplus: surplusPct,
    notResponded: notRespondedPct,
    unavailable: unavailablePct,
  };
}
