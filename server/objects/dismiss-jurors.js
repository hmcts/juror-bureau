/* eslint-disable strict */
'use strict';

const _ = require('lodash');
const { DAO } = require('./dataAccessObject');
const utils = require('../lib/utils');
const { mapCamelToSnake, mapSnakeToCamel, replaceAllObjKeys } = require('../lib/mod-utils');

module.exports.getDismissablePools = new DAO('moj/pool-request/active-pools-by-court', {
  get: function(locCode) {
    return {
      uri: this.resource + '?locCode=' + locCode,
      transform: (data) => {
        const poolsAtCourtLocation = data.data || [];

        delete data._headers;
        return {
          ...mapSnakeToCamel(data),
          poolsAtCourtLocation: mapSnakeToCamel(poolsAtCourtLocation),
        };
      }
    }
  }
});

module.exports.getJurorsObject = new DAO('moj/juror-management/jurors-to-dismiss', {
  post: function(params, locCode) {
    const jurorsToInclude = params['jurors-to-include'] instanceof Array
      ? params['jurors-to-include']
      : [params['jurors-to-include']];

    const body = {
      poolNumbers: params['checked-pools'] instanceof Array
        ? params['checked-pools']
        : [params['checked-pools']],
      locationCode: locCode,
      numberOfJurorsToDismiss: params['jurorsToDismiss'],
      includeJurorsOnCall: jurorsToInclude.includes('on-call') ? true : false,
      includeJurorsNotInAttendance: jurorsToInclude.includes('not-in-attendance') ? true : false,
    }

    return {
      uri: this.resource,
      body: mapCamelToSnake(body),
      transform: (data) => {

        delete data._headers;
        return mapSnakeToCamel(data);
      },
    }
  }
});

module.exports.dismissJurorsObject = new DAO('moj/complete-service/dismissal', {
  patch: function(payload) {
    return {
      uri: this.resource,
      body: replaceAllObjKeys(payload, _.snakeCase),
      transform: utils.basicDataTransform,
    }
  }
});
