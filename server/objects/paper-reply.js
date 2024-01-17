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
    },
    includeHeaders = (data, response) => {
      return { headers: response.headers, data };
    }

    , paperReplyObject = {
      resourcePost: 'moj/juror-paper-response/response',
      resourceGet: 'moj/juror-paper-response/juror',
      post: function(rp, app, jwtToken, pr) {
        var reqOptions = _.clone(options)
          , tempObj = {
            'addressCounty': pr.addressCounty,
            'addressLineOne': pr.addressLineOne,
            'addressLineThree': pr.addressLineThree,
            'addressLineTwo': pr.addressLineTwo,
            'addressPostcode': pr.addressPostcode,
            'addressTown': pr.addressTown,
            'cjsEmployment': pr.cjsEmployment,
            // this is a weird one that happens on the test environemtn... dates do not convert properly
            // ... this should fix for now but moving to an ISO standard should fix the bigger issue of dates
            'dateOfBirth': pr.dateOfBirth.split('/').map(num => num.padStart(2, '0')).reverse().join('-'),
            'deferral': pr.deferral,
            'eligibility': pr.eligibility,
            'emailAddress': pr.emailAddress,
            'excusal': pr.excusal,
            'firstName': pr.firstName,
            'jurorNumber': pr.jurorNumber,
            'lastName': pr.lastName,
            'signed': pr.signed,
            'specialNeeds': pr.specialNeeds,
            'thirdParty': (typeof pr.thirdParty === 'string') ? null : pr.thirdParty,
            'title': pr.title,
            'welsh': pr.welsh,
            'canServeOnSummonsDate': pr.canServeOnSummonsDate,
          };

        if (pr.primaryPhone !== '') {
          tempObj.primaryPhone = pr.primaryPhone;
        }
        if (pr.secondaryPhone !== '') {
          tempObj.secondaryPhone = pr.secondaryPhone;
        }

        if (pr.pendingFirstName) {
          tempObj.title = pr.pendingTitle;
          tempObj.firstName = pr.pendingFirstName;
          tempObj.lastName = pr.pendingLastName;
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

      get: function(rp, app, jwtToken, jurorNumber) {
        var reqOptions = _.cloneDeep(options);

        reqOptions.transform = includeHeaders;
        reqOptions.headers.Authorization = jwtToken;
        reqOptions.uri = urljoin(reqOptions.uri, this.resourceGet, jurorNumber);
        reqOptions.method = 'GET';

        app.logger.info('Sending request to API: ', {
          uri: reqOptions.uri,
          headers: reqOptions.headers,
          method: reqOptions.method,
        });

        return rp(reqOptions);
      },
    };

  module.exports.paperReplyObject = paperReplyObject;
})();
