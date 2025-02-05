/* eslint-disable strict */
'use strict';

const { DAO } = require('./dataAccessObject');
const utils = require('../lib/utils');

module.exports.getDismissablePools = new DAO('moj/pool-request/active-pools-by-court', {
  get: function(locCode) {
    return {
      uri: this.resource + '?locCode=' + locCode,
      transform: utils.basicDataTransform
    }
  }
});

module.exports.getJurorsObject = new DAO('moj/juror-management/jurors-to-dismiss', {
  post: function(params, locCode) {
    const jurorsToInclude = params['jurors-to-include'] instanceof Array
      ? params['jurors-to-include']
      : [params['jurors-to-include']];

    const body = {
      'poolNumbers': params['checked-pools'] instanceof Array
        ? params['checked-pools']
        : [params['checked-pools']],
      'locationCode': locCode,
      'numberOfJurorsToDismiss': params['jurorsToDismiss'],
      'includeJurorsOnCall': jurorsToInclude.includes('on-call') ? true : false,
      'includeJurorsNotInAttendance': jurorsToInclude.includes('not-in-attendance') ? true : false,
    }

    return {
      uri: this.resource,
      body,
      transform: utils.basicDataTransform,
    }
  }
});

module.exports.dismissJurorsObject = new DAO('moj/complete-service/dismissal');
