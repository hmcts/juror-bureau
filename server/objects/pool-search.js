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

    , poolSearchObject = {
      resource: 'moj/pool-search',
      post: function(rp, app, jwtToken, searchParams) {
        var reqOptions = _.clone(options)
          , tmpBody = {};

        if (typeof searchParams.locCode !== 'undefined' && searchParams.locCode !== '') {
          tmpBody.locCode = searchParams.locCode;
        }

        if (typeof searchParams.poolNumber !== 'undefined' && searchParams.poolNumber !== '') {
          tmpBody.poolNumber = searchParams.poolNumber;
        }

        if (typeof searchParams.serviceStartDate !== 'undefined' && searchParams.serviceStartDate !== '') {
          tmpBody.serviceStartDate = searchParams.serviceStartDate;
        }

        if (typeof searchParams.date !== 'undefined' && searchParams.date !== '') {
          tmpBody.serviceStartDate = searchParams.date;
        }

        if (searchParams.poolStatus) {
          if (Array.isArray(searchParams.poolStatus)) {
            tmpBody.poolStatus = searchParams.poolStatus;
          } else {
            tmpBody.poolStatus = searchParams.poolStatus.split(',');
          }
        }

        if (searchParams.poolStage) {
          if (Array.isArray(searchParams.poolStage)) {
            tmpBody.poolStage = searchParams.poolStage;
          } else {
            tmpBody.poolStage = searchParams.poolStage.split(',');
          }
        }

        if (searchParams.poolType) {
          if (Array.isArray(searchParams.poolType)) {
            tmpBody.poolType = searchParams.poolType;
          } else {
            tmpBody.poolType = searchParams.poolType.split(',');
          }
        }

        tmpBody.offset = searchParams.page - 1 || 0;
        tmpBody.sortDirection = 'ASC';
        tmpBody.sortColumn = 'POOL_NO';

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

  module.exports.poolSearchObject = poolSearchObject;
})();
