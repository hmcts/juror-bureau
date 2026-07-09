(function() {
  'use strict';

  const { DAO } = require('./dataAccessObject');
  const urljoin = require('url-join');
  const { basicDataTransform } = require('../lib/utils');
  const { extractDataAndHeadersFromResponse } = require('../lib/mod-utils');

  function normaliseThirdPartyForFe(response) {
    const details = response.data || response.response || response;
    const thirdParty = details?.thirdParty;

    if (!thirdParty) {
      return response;
    }

    if (typeof thirdParty.thirdPartyFname !== 'undefined') {
      thirdParty.thirdPartyFName = thirdParty.thirdPartyFname;
      delete thirdParty.thirdPartyFname;
    }

    if (typeof thirdParty.thirdPartyLname !== 'undefined') {
      thirdParty.thirdPartyLName = thirdParty.thirdPartyLname;
      delete thirdParty.thirdPartyLname;
    }

    return response;
  }

  function normaliseThirdPartyForRequest(thirdParty) {
    if (typeof thirdParty === 'string') {
      return null;
    }

    if (!thirdParty) {
      return thirdParty;
    }

    const requestThirdParty = {
      ...thirdParty,
      thirdPartyPhone: thirdParty.mainPhone,
      thirdPartyEmail: thirdParty.emailAddress,
    };

    delete requestThirdParty.mainPhone;
    delete requestThirdParty.emailAddress;

    return requestThirdParty;
  }

  module.exports.paperReplyObject = new DAO('moj/juror-paper-response/response', {
    post: function(pr) {
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
        'excusal': pr.excusal,
        'firstName': pr.firstName,
        'jurorNumber': pr.jurorNumber,
        'lastName': pr.lastName,
        'signed': pr.signed,
        'specialNeeds': pr.specialNeeds,
        'thirdParty': normaliseThirdPartyForRequest(pr.thirdParty),
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
      if (pr.emailAddress !== '') {
        body.emailAddress = pr.emailAddress;
      }

      if (pr.pendingFirstName) {
        body.title = pr.pendingTitle;
        body.firstName = pr.pendingFirstName;
        body.lastName = pr.pendingLastName;
      }

      return {
        uri: this.resource,
        body,
        transform: basicDataTransform,
      }
    },
    get: function(jurorNumber) {
      return {
        uri: urljoin('moj/juror-paper-response/juror', jurorNumber),
        transform: (data) => normaliseThirdPartyForFe(extractDataAndHeadersFromResponse('data')(data)),
      }
    }
  });
})();
