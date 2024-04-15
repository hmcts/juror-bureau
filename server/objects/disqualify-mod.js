; (function() {
  'use strict';

  const rp = require('request-promise');

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
    },

    /**
     * Retrieve a list of valid disqualify reasons with accompanying codes
     *
     * @param jwtToken - JSON Web Token containing user authentication context
     */
    getDisqualificationReasons = {
      resource: 'moj/disqualify/reasons',
      get: function(__, app, jwtToken) {
        let reqOptions = _.clone(options);

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
    },

    /**
     * Submit the disqualification reason for a juror
     *
     * @param jwtToken - JSON Web Token containing user authentication context
     * @param jurorNumber - the juror number for the juror being disqualified
     * @param code - the disqualification reason code
     * @param replyMethod - the reply method of the summons reply (DIGITAL || PAPER)
     */
    disqualifyJuror = {
      resource: 'moj/disqualify/juror',
      patch: function(__, app, jwtToken, jurorNumber, disqualifyCode, replyMethod) {
        let reqOptions = _.clone(options),
          tmpBody = {};

        delete tmpBody._csrf;

        tmpBody.code = disqualifyCode;
        tmpBody.replyMethod = replyMethod.toUpperCase();

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resource, jurorNumber);

        reqOptions.method = 'PATCH';
        reqOptions.body = tmpBody;

        app.logger.debug('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tmpBody,
        });

        return rp(reqOptions);
      },
    };

  module.exports.getDisqualificationReasons = getDisqualificationReasons;
  module.exports.disqualifyJuror = disqualifyJuror;
})();
