/* eslint-disable strict */

const _ = require('lodash');
const { constants, transformCourtNames, paginationBuilder } = require('../../../lib/mod-utils');
const { searchCoronerPoolsDAO, fetchAllCourtsDAO } = require('../../../objects');
const { Logger } = require('../../../components/logger');
const validate = require('validate.js');
const coronerPoolSearchValidation = require('../../../config/validation/coroner-pool-search');

module.exports.getSearchPools = function(app) {
  return async function(req, res) {
    const { poolNumber, requestedBy, dateRequested, court, sortBy, sortOrder } = req.query;
    let results;
    let courts;
    let urlPrefix;
    let pagination;

    try {
      const _courts = await fetchAllCourtsDAO.get(req);

      app.logger.info('Fetched courts list', {
        auth: req.session.authentication,
        data: {
          courts: {
            count: _courts.courts.length,
          },
        },
      });

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

        pagination = paginationBuilder(results.totalItems, req.query.page || 1, req.url);

        // delete the headers
        delete results._headers;

        app.logger.info('Successeful search of coroner pools', {
          auth: req.session.authentication,
          data: { results },
        });
      } catch (err) {
        Logger.instance.crit('Failed to search coroner pools', {
          auth: req.session.authentication,
          data: { payload },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        results = { data: [] };
      }
    }

    const tmpErrors = _.clone(req.session.errors);
    const tmpFields = _.clone(req.session.formFields);

    delete req.session.errors;
    delete req.session.formFields;

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
      pagination,
      tmpFields,
      errors: {
        title: 'There is a problem',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postSearchPools = function(app) {
  return function(req, res) {
    const coronerSearchUrl = app.namedRoutes.build('coroner-pool.search.get');
    const validationResults = validate(req.body, coronerPoolSearchValidation(req.body));

    if (validationResults) {
      req.session.errors = _.clone(validationResults);
      req.session.formFields = _.clone(req.body);

      return res.redirect(coronerSearchUrl);
    }

    const query = buildQueryParams(req.body);

    return res.redirect(coronerSearchUrl + `?${query.join('&')}`);
  };
};

function buildPayload({ poolNumber, requestedBy, dateRequested, court, page, sortBy, sortOrder }) {
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
    'sortMethod': sortOrder === 'ascending' ? 'ASC' : 'DESC',
    'pageLimit': constants.PAGE_SIZE,
    'pageNumber': page || 1,
    'sortField': sortByMapper(),
  };

  if (poolNumber) {
    payload['pool_number'] = poolNumber;
  }
  if (requestedBy) {
    payload['requested_by'] = requestedBy;
  }
  if (dateRequested) {
    const dateParts = dateRequested.split('/');

    dateParts[0] = _.padStart(dateParts[0], 2, '0');
    dateParts[1] = _.padStart(dateParts[1], 2, '0');

    payload['requested_date'] = dateParts.reverse().join('-');
  }
  if (court) {
    const locCode = court.match(/\d+/g);

    if (locCode && locCode.length) {
      payload['location_code'] = locCode[0];
    }
  }

  return payload;
}

function buildQueryParams(data) {
  const params = [];

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
