;(function(){
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

    , nilPoolCheck = {
      resource: 'moj/pool-create/nil-pool-check',
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = {};

        tmpBody.attendanceDate = body.attendanceDate;
        tmpBody.attendanceTime = body.attendanceTime;
        tmpBody.courtCode = body.selectedCourtCode;
        tmpBody.courtName = body.selectedCourtName;
        tmpBody.poolType = body.poolType;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: tmpBody,
        });

        return rp(reqOptions);
      },
    }

    , nilPoolCreate = {
      resource: 'moj/pool-create/nil-pool-create',
      post: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'POST';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: tmpBody,
        });

        return rp(reqOptions);
      },
    }

    , nilPoolConvert = {
      resource: 'moj/pool-create/nil-pool-convert',
      put: function(rp, app, jwtToken, body) {
        var reqOptions = _.clone(options)
          , tmpBody = _.clone(body);

        delete tmpBody._csrf;

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource);
        reqOptions.method = 'PUT';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          body: tmpBody,
        });

        return rp(reqOptions);
      }
    }

  module.exports.nilPoolCheck = nilPoolCheck;
  module.exports.nilPoolCreate = nilPoolCreate;
  module.exports.nilPoolConvert = nilPoolConvert;
})();
