(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , trialsListObject = {
      resource: 'moj/trial/list',
      get: function(rp, app, jwtToken, opts) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?page_number=' + (opts.pageNumber - 1).toString(),
          '&sort_by=' + opts.sortBy,
          '&sort_order=' + opts.sortOrder,
          '&is_active=' + opts.isActive
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: opts,
        });

        return rp(reqOptions);
      },
    }

    , trialDetailsObject = {
      resource: 'moj/trial/summary',
      get: function(rp, app, jwtToken, trialNumber, locationCode) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(
          reqOptions.uri,
          this.resource,
          '?trial_number=' + trialNumber,
          '&location_code=' + locationCode
        );
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: {
            trialNumber,
            locationCode,
          },
        });

        return rp(reqOptions);
      },
    }

    , courtroomsObject = {
      resource: 'moj/trial/courtrooms/list',
      get: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , judgesObject = {
      resource: 'moj/trial/judge/list',
      get: function(rp, app, jwtToken) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'GET';

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    }

    , createTrialObject = {
      resource: 'moj/trial/create',
      post: function(rp, app, jwtToken, payload) {
        var reqOptions = _.clone(options);

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = payload;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: reqOptions.body,
        });

        return rp(reqOptions);
      },
    };

  module.exports.trialsListObject = trialsListObject;
  module.exports.trialDetailsObject = trialDetailsObject;
  module.exports.courtroomsObject = courtroomsObject;
  module.exports.judgesObject = judgesObject;
  module.exports.createTrialObject = createTrialObject;

})();
