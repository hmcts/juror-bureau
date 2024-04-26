/* eslint-disable strict */

const { constants, transformCourtNames } = require('../../../lib/mod-utils');
const { searchCoronerPoolsDAO, fetchAllCourtsDAO } = require('../../../objects');
const { dateFilter } = require('../../../components/filters');
const { Logger } = require('../../../components/logger');

module.exports.getSearchPools = function(app) {
  return async function(req, res) {
    const { poolNumber, requestedBy, dateRequested, court, sortBy, sortOrder } = req.query;
    let results;
    let courts;
    let urlPrefix;

    debugger;

    try {
      const _courts = await fetchAllCourtsDAO.get(req);

      courts = transformCourtNames(_courts.courts);
    } catch (err) {
      Logger.instance.crit('Failed to fetch courts list', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });
    }

    if (poolNumber || requestedBy || dateRequested || court) {
      const payload = buildPayload(req.query);

      try {
        results = await searchCoronerPoolsDAO.post(req, payload);
        urlPrefix = '?' + buildQueryParams(req.query).join('&');

        // delete the headers
        delete results._headers;
      } catch (err) {
        Logger.instance.crit('Failed to search coroner pools', {
          auth: req.session.authentication,
          data: { payload },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }
    }

    return res.render('pool-management/coroner-court/coroner-pool-search', {
      backLinkUrl: 'pool-search.get',
      courts,
      results,
      poolNumber,
      requestedBy,
      dateRequested,
      court,
      urlPrefix,
      sortBy: sortBy || 'poolNumber',
      sortOrder,
    });
  };
};

module.exports.postSearchPools = function(app) {
  return function(req, res) {

    const query = buildQueryParams(req.body);

    return res.redirect(app.namedRoutes.build('coroner-pool.search.get') + `?${query.join('&')}`);
  };
};

function buildPayload({ poolNumber, requestedBy, dateRequested, court, page, sortBy, direction }) {
  const sortByMapper = () => {
    switch (sortBy) {
    case 'poolNumber':
      return 'POOL_NUMBER';
    case 'requestedBy':
      return 'REQUESTED_BY';
    case 'dateRequested':
      return 'REQUESTED_DATE';
    case 'court':
      return 'COURT_NAME';
    default:
      return 'POOL_NUMBER';
    }
  };

  const payload = {
    'sort_method': direction === 'ascending' ? 'ASC' : 'DESC',
    'page_limit': constants.PAGE_SIZE,
    'page_number': page || 1,
    'sort_field': sortByMapper(),
  };

  if (poolNumber) {
    payload['pool_number'] = poolNumber;
  }
  if (requestedBy) {
    payload['requested_by'] = requestedBy;
  }
  if (dateRequested) {
    payload['requested_date'] = dateFilter(dateRequested, 'DD/MM/YYYY', 'YYYY-MM-DD');
  }
  if (court) {
    const locCode = court.match(/\d+/g);

    if (locCode.length) {
      payload['location_code'] = locCode[0];
    }
  }

  return payload;
}

function buildQueryParams(data) {
  const params = [];

  debugger;

  if (data.poolNumber) {
    params.push(`poolNumber=${data.poolNumber}`);
  }

  if (data.requestedBy) {
    params.push(`requestedBy=${data.requestedBy}`);
  }

  if (data.dateRequested) {
    params.push(`dateRequested=${data.dateRequested}`);
  }

  if (data.courtNameOrLocation || data.court) {
    params.push(`court=${data.courtNameOrLocation || data.court}`);
  }

  return params;
}
