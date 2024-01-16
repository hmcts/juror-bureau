(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , dateFilter = require('../components/filters').dateFilter
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

    , summonCitizenObject = {
      resource: 'moj/pool-create',
      post: function(rp, app, jwtToken, body, endpoint) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        if (endpoint === 'create-pool') {
          tmpBody.startDate = dateFilter(new Date(tmpBody.courtDate), null, 'YYYY-MM-DD');
          tmpBody.attendTime = [tmpBody.startDate, '09:00'].join(' ');
        }

        delete tmpBody.courtDate;
        delete tmpBody._csrf;

        // if we only select one postcode it will not be an array
        // make it an array then to pass backend validation
        if (tmpBody.postcodes instanceof Array === false) {
          tmpBody.postcodes = [tmpBody.postcodes];
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, endpoint);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            body: tmpBody,
          }
        });

        return rp(reqOptions);
      }
    }

  module.exports.summonCitizenObject = summonCitizenObject;

})();
