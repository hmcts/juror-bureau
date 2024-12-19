(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform } = require('../lib/utils');
  const { extractDataAndHeadersFromResponse } = require('../lib/mod-utils');

  module.exports.paperReplyObject = new DAO('moj/juror-paper-response/response', {
    post: function(pr) {
      console.log('\n\nPR THIRD PARTY\n', pr.thirdParty, '\n\n');
      let body = {
        'addressCounty': pr.addressCounty,
        'addressLineOne': pr.addressLineOne,
        'addressLineThree': pr.addressLineThree,
        'addressLineTwo': pr.addressLineTwo,
        'addressPostcode': pr.addressPostcode,
        'addressTown': pr.addressTown,
        'cjsEmployment': pr.cjsEmployment,
        // this is a weird one that happens on the test environemtn... dates do not convert properly
        // ... this should fix for now but moving to an ISO standard should fix the bigger issue of dates
        'dateOfBirth': pr.dateOfBirth !== '' ? pr.dateOfBirth.split('/').map(num => num.padStart(2, '0')).reverse().join('-') : null,
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
        body.primaryPhone = pr.primaryPhone;
      }
      if (pr.secondaryPhone !== '') {
        body.secondaryPhone = pr.secondaryPhone;
      }

      if (pr.pendingFirstName) {
        body.title = pr.pendingTitle;
        body.firstName = pr.pendingFirstName;
        body.lastName = pr.pendingLastName;
      }

      console.log('\n\nREQUEST BODY\n', body, '\n\n');

      return {
        uri: this.resource,
        body,
        transform: basicDataTransform,
      }
    },
    get: function(jurorNumber) {
      return {
        uri: urljoin('moj/juror-paper-response/juror', jurorNumber),
        transform: extractDataAndHeadersFromResponse('data'),
      }
    }
  });
})();
