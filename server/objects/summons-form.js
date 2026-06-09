const { DAO } = require('./dataAccessObject');
const { dateFilter } = require('../components/filters');
const { mapCamelToSnake } = require('../lib/mod-utils');
const { basicDataTransform2 } = require('../lib/utils');

module.exports.summonsFormDAO = new DAO('moj/pool-create/summons-form', {
  post: function(pd, catchmentArea) {
    const nextDate = dateFilter(new Date(pd.poolDetails.courtStartDate), null, 'YYYY-MM-DD');

    const body = {
      poolNumber: pd.poolDetails.poolNumber,
      nextDate,
      catchmentArea,
      attendTime: nextDate + ' 00:00',
      noRequested: pd.bureauSummoning.requestedFromBureau,
    };

    return {
      body: mapCamelToSnake(body),
      transform: basicDataTransform2,
    };
  },
});
