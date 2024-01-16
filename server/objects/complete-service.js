;(function(){
  'use strict';

  var urljoin = require('url-join')
    , config = require('../config/environment')()
    , { dateFilter } = require('../components/filters')
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
    , rp = require('request-promise');

  const completeService = {
    resource: 'moj/complete-service/',
    patch: (app, jwtToken, /** @type {{ pool: number; completionDate: string; selectedJurors: number[]; }} */ opts) => {
      const url = `${completeService.resource}${opts.pool}/complete`;
      const data = {
        'completion_date': dateFilter(opts.completionDate, 'DD/MM/YYYY', 'YYYY-MM-DD'),
        'juror_numbers': opts.selectedJurors,
      };

      // Old style
      const reqOptions = {...options};

      reqOptions.headers.Authorization = jwtToken;
      reqOptions.method = 'PATCH';
      reqOptions.uri = urljoin(reqOptions.uri, url);
      reqOptions.body = data;

      app.logger.info('Sending request to API: ', {
        uri: reqOptions.uri,
        headers: reqOptions.headers,
        method: reqOptions.method,
        body: reqOptions.body,
      });

      return rp(reqOptions);

      // New style
      // return axiosInstance(req, url, {
      //   method: 'PATCH',
      //   data,
      // });
    },
  };

  module.exports.completeService = completeService;
})();
