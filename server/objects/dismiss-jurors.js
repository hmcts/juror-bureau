/* eslint-disable strict */
'use strict';

const { DAO } = require('./dataAccessObject');
const _ = require('lodash');
const config = require('../config/environment')();
const utils = require('../lib/utils');
const urljoin = require('url-join');
const options = {
  uri: config.apiEndpoint,
  headers: {
    'User-Agent': 'Request-Promise',
    'Content-Type': 'application/vnd.api+json',
  },
  json: true,
  transform: utils.basicDataTransform,
};

module.exports.getJurorsObject = {
  resource: 'moj/juror-management/jurors-to-dismiss',
  get: function(rp, app, jwtToken, params, locCode) {
    const reqOptions = _.clone(options);

    reqOptions.headers.Authorization = jwtToken;
    reqOptions.uri = urljoin(reqOptions.uri, this.resource);
    reqOptions.method = 'GET';

    const jurorsToInclude = params['jurors-to-include'] instanceof Array
      ? params['jurors-to-include']
      : [params['jurors-to-include']];

    reqOptions.body = {
      'pool_numbers': params['checked-pools'] instanceof Array
        ? params['checked-pools']
        : [params['checked-pools']],
      'location_code': locCode,
      'number_of_jurors_to_dismiss': params['jurorsToDismiss'],
      'include_jurors_on_call': jurorsToInclude.includes('on-call') ? true : false,
      'include_jurors_not_in_attendance': jurorsToInclude.includes('not-in-attendance') ? true : false,
    };

    app.logger.info('Sending request to API: ', {
      uri: reqOptions.uri,
      headers: reqOptions.headers,
      method: reqOptions.method,
    });

    return rp(reqOptions);
  },
};

// GET WITH BODY NOT SUPPORTED BY AXIOS
// module.exports.getJurorsObject = new DAO('moj/juror-management/jurors-to-dismiss', {
//   get: function(jwtToken, params, locCode) {
//     const jurorsToInclude = params['jurors-to-include'] instanceof Array
//       ? params['jurors-to-include']
//       : [params['jurors-to-include']];

//     const body = {
//       'pool_numbers': params['checked-pools'] instanceof Array
//         ? params['checked-pools']
//         : [params['checked-pools']],
//       'location_code': locCode,
//       'number_of_jurors_to_dismiss': params['jurorsToDismiss'],
//       'include_jurors_on_call': jurorsToInclude.includes('on-call') ? true : false,
//       'include_jurors_not_in_attendance': jurorsToInclude.includes('not-in-attendance') ? true : false,
//     }

//     return {
//       uri: this.resource,
//       body
//     }
//   }
// });

module.exports.dismissJurorsObject = new DAO('moj/complete-service/dismissal');
