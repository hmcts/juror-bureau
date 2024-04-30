/* eslint-disable strict */

const _ = require('lodash');
const urljoin = require('url-join');
const { searchJurorRecordDAO } = require('../../../objects');
const { constants, paginationBuilder, makeManualError } = require('../../../lib/mod-utils');
const { capitalizeFully } = require('../../../components/filters');

module.exports.getSearch = function(app) {
  return async function(req, res) {
    const { jurorNumber, jurorName, postcode, poolNumber, sortBy, sortOrder } = req.query;

    let jurorRecords;
    let totalResults;
    let pagination;
    let urlPrefix;
    let bvr;

    if (jurorNumber || jurorName || postcode || poolNumber) {
      const payload = buildSearchPayload(req.query);

      try {
        const response = await searchJurorRecordDAO.post(req, payload);

        totalResults = response.total_items;
        jurorRecords = transformResults(response.data, app.namedRoutes);

        pagination = paginationBuilder(totalResults, req.query.page || 1, req.url);

        urlPrefix = '?' + buildQueryParams(req.query).join('&');
      } catch (err) {
        // if fails show no results
        jurorRecords = [];

        app.logger.crit('Failed to search for juror records: ', {
          auth: req.session.authentication,
          data: { payload },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422) {
          if (err.error.code === 'MAX_ITEMS_EXCEEDED') {
            bvr = err.error.code;
          }
        }
      }
    }

    const tmpErrors = _.clone(req.session.errors);
    const tmpFields = _.clone(req.session.formFields);

    delete req.session.errors;
    delete req.session.formFields;

    return res.render('juror-management/search/index', {
      totalResults,
      jurorRecords,
      jurorNumber,
      jurorName,
      postcode,
      poolNumber,
      pagination,
      urlPrefix,
      sortBy,
      sortOrder,
      bvr,
      tmpFields,
      errors: {
        message: '',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postSearch = function(app) {
  return function(req, res) {
    const redirectUrl = app.namedRoutes.build('juror-record.search.get');

    if (req.body.globalSearch && !/^\d{1,9}$/.test(req.body.globalSearch)) {
      req.session.errors =
        makeManualError('jurorNumber', 'Enter a valid juror number');
      req.session.formFields = { jurorNumber: req.body.globalSearch };

      return res.redirect(redirectUrl);
    }

    const queryParams = buildQueryParams(req.body);

    return res.redirect(redirectUrl + `?${queryParams.join('&')}`);
  };
};

module.exports.selectJuror = function(app) {
  return function(req, res) {
    const { jurorNumber, locCode } = req.query;

    req.session.locCode = locCode;

    return res.redirect(app.namedRoutes.build('juror-record.overview.get', {
      jurorNumber,
    }));
  };
};

function buildSearchPayload({ jurorNumber, jurorName, postcode, poolNumber, page, sortBy, sortOrder }) {
  const sortByMapper = () => {
    switch (sortBy) {
    case 'jurorNumber':
      return 'JUROR_NUMBER';
    case 'jurorName':
      return 'JUROR_NAME';
    case 'POSTCODE':
      return 'postcode';
    case 'poolNumber':
      return 'POOL_NUMBER';
    case 'court':
      return 'COURT_NAME';
    case 'status':
      return 'STATUS';
    default:
      return 'JUROR_NUMBER';
    }
  };

  const payload = {
    'sort_method': sortOrder === 'ascending' ? 'ASC' : 'DESC',
    'sort_field': sortByMapper(),
    'page_limit': constants.PAGE_SIZE,
    'page_number': page || 1,
  };

  if (jurorNumber) {
    payload['juror_number'] = jurorNumber;
  }
  if (jurorName) {
    payload['juror_name'] = jurorName;
  }
  if (postcode) {
    payload['postcode'] = postcode;
  }
  if (poolNumber) {
    payload['pool_number'] = poolNumber;
  }

  return payload;
}

function buildQueryParams(data) {
  const { jurorNumber, jurorName, postcode, poolNumber, globalSearch } = data;
  const queryParams = [];

  if (jurorNumber) {
    queryParams.push(`jurorNumber=${jurorNumber}`);
  }
  if (jurorName) {
    queryParams.push(`jurorName=${jurorName}`);
  }
  if (postcode) {
    queryParams.push(`postcode=${postcode}`);
  }
  if (poolNumber) {
    queryParams.push(`poolNumber=${poolNumber}`);
  }
  if (globalSearch) {
    queryParams.push(`jurorNumber=${globalSearch}`);
  }

  return queryParams;
}

function transformResults(jurorRecords, namedRoutes) {
  const list = [];

  if (!jurorRecords.length) return list;

  jurorRecords.forEach(function(jurorRecord) {
    const url = urljoin(namedRoutes.build('juror-record.select.get'),
      '?jurorNumber=' + jurorRecord.juror_number,
      '&locCode=' + jurorRecord.loc_code);

    list.push([
      {
        html: '<a href="'+ url +'" class="govuk-link">' + jurorRecord.juror_number + '</a>',
      },
      {
        text: capitalizeFully(jurorRecord.juror_name),
      },
      {
        text: jurorRecord.postcode,
      },
      {
        text: jurorRecord.pool_number,
      },
      {
        text: capitalizeFully(jurorRecord.court_name),
      },
      {
        text: jurorRecord.status,
      },
    ]);
  });

  return list;
}
