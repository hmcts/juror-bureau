;(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json'
      },
      json: true,
      transform: utils.basicDataTransform,
    }
    , dateFilter = require('../components/filters').dateFilter

    , poolSummaryObject = {
      resource: 'moj/pool-create/summons-form',
      post: function(rp, app, jwtToken, pd) {
        var reqOptions = _.clone(options)
          , tmpBody = {};

        tmpBody.poolNumber = pd.poolDetails.poolNumber;
        tmpBody.nextDate = dateFilter(new Date(pd.poolDetails.courtStartDate), null, 'YYYY-MM-DD');
        tmpBody.catchmentArea = pd.currentCatchmentArea;
        tmpBody.attendTime = tmpBody.nextDate + ' 00:00';
        tmpBody.noRequested = pd.bureauSummoning.required;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: reqOptions.body,
        });

        return rp(reqOptions);
      },
    }

  module.exports.poolSummaryObject = poolSummaryObject;
})();
