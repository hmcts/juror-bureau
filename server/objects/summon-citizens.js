const { DAO } = require('./dataAccessObject');
const { dateFilter } = require('../components/filters');
const urljoin = require('url-join').default;

module.exports.summonCitizensDAO = new DAO('moj/pool-create', {
  post: function(_body, endpoint) {
    const uri = urljoin(this.resource, endpoint);
    const body = { ..._body };

    if (endpoint === 'create-pool') {
      body.startDate = dateFilter(new Date(_body.courtDate), null, 'YYYY-MM-DD');
      body.attendTime = [body.startDate, '09:00'].join(' ');
    }

    delete body.courtDate;
    delete body._csrf;

    if (!(_body.postcodes instanceof Array)) {
      body.postcodes = [_body.postcodes];
    }

    return { uri, body };
  },
});
