const urljoin = require('url-join').default;
const modUtils = require('../lib/mod-utils')
const { DAO } = require('./dataAccessObject');

const SORT_KEYS = {
  returnDate: 'RETURN_DATE',
  poolNumber: 'POOL_NUMBER',
  poolType: 'POOL_TYPE',
  courtName: 'COURT_NAME',
  numberRequested: 'JURORS_REQUESTED',
  serviceStartDate: 'SERVICE_START_DATE',
  jurorsInPool: 'JURORS_IN_POOL',
  totalNumberRequested: 'TOTAL_NUMBER_REQUESTED',
  jurorsConfirmed: 'JURORS_CONFIRMED',
  poolCapacity: 'POOL_CAPACITY',
}

const STATUS = {
  created: 'active',
  requested: 'requested',
}

module.exports.poolRequestsDAO = new DAO('moj/pool-request/pools-', {
  get: function(options) {
    const defaultSortBy = options.status === 'requested' ? 'RETURN_DATE' : 'SERVICE_START_DATE';
    const query = {
      status: options.status,
      tab: options.tab,
      pageNumber: options.page,
      sortBy: SORT_KEYS[options.sortBy] || defaultSortBy,
      sortOrder: options.sortOrder === 'descending' ? 'DESC' : 'ASC',
      pageLimit: modUtils.constants.PAGE_SIZE,
    };

    let uri = urljoin(this.resource + STATUS[options.status], '?');

    if (options.locCode) {
      query.locCode = options.locCode;
    }

    uri = uri + Object.keys(query).map(key => `${key}=${query[key]}`).join('&');

    return { uri };
  },
});
