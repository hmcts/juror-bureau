(function() {
  'use strict';

  var _ = require('lodash')
    , urljoin = require('url-join')
    , config = require('../config/environment')()
    , utils = require('../lib/utils')
    , dateFilter = require('../components/filters').dateFilter
    , options = {
      uri: config.apiEndpoint,
      headers: {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'application/vnd.api+json',
      },
      json: true,
      transform: utils.basicDataTransform,
    }

    , jurorCreateObject = {
      resourcePost: 'moj/juror-record/create-juror',
      post: function(rp, app, jwtToken, pr) {
        var reqOptions = _.clone(options)
          , tempObj = {
            'title': pr.jurorName.title,
            'first_name': pr.jurorName.firstName,
            'last_name': pr.jurorName.lastName,
            'address': {
              'line_one': pr.jurorAddress.addressLineOne,
              'line_two': pr.jurorAddress.addressLineTwo,
              'line_three': pr.jurorAddress.addressLineThree,
              'town': pr.jurorAddress.addressTown,
              'county': pr.jurorAddress.addressCounty,
              'postcode': pr.jurorAddress.addressPostcode,
            },
            'date_of_birth': dateFilter(pr.jurorDob, 'DD/MM/YYYY', 'YYYY-MM-DD'),
            ...(pr.jurorContact.mainPhone && {'primary_phone': pr.jurorContact.mainPhone}),
            ...(pr.jurorContact.alternativePhone && {'alternative_phone': pr.jurorContact.alternativePhone}),
            ...(pr.jurorContact.emailAddress && {'email_address': pr.jurorContact.emailAddress}),
            'notes': pr.notes,
            'pool_number': pr.poolNumber,
            'court_code' : pr.courtLocCode,
          };

        if (pr.hasOwnProperty('createPool')) {
          tempObj['service_start_date'] = dateFilter(pr.createPool.attendanceDate, 'DD/MM/YYYY', 'YYYY-MM-DD');
          tempObj['pool_type'] = pr.createPool.poolType;
          tempObj['court_code'] = pr.createPool.courtLocCode;
          delete tempObj['pool_number'];
        }

        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resourcePost);
        reqOptions.method = 'POST';
        reqOptions.body = tempObj;

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
          data: tempObj,
        });

        return rp(reqOptions);
      },
    };

  module.exports.jurorCreateObject = jurorCreateObject;
})();
