;(function() {
  'use strict';

  const _ = require('lodash');
  const { DAO } = require('./dataAccessObject');
  const { basicDataTransform2 } = require('../lib/utils');
  const { replaceAllObjKeys } = require('../lib/mod-utils');

  module.exports.poolSearchObject = new DAO('moj/pool-search', {
    post: function(searchParams) {
        const tmpBody = {};

        if (typeof searchParams.locCode !== 'undefined' && searchParams.locCode !== '') {
          tmpBody.locCode = searchParams.locCode;
        }

        if (typeof searchParams.poolNumber !== 'undefined' && searchParams.poolNumber !== '') {
          tmpBody.poolNumber = searchParams.poolNumber;
        }

        if (typeof searchParams.serviceStartDate !== 'undefined' && searchParams.serviceStartDate !== '') {
          tmpBody.serviceStartDate = searchParams.serviceStartDate;
        }

        if (typeof searchParams.date !== 'undefined' && searchParams.date !== '') {
          tmpBody.serviceStartDate = searchParams.date;
        }

        if (searchParams.poolStatus) {
          if (Array.isArray(searchParams.poolStatus)) {
            tmpBody.poolStatus = searchParams.poolStatus;
          } else {
            tmpBody.poolStatus = searchParams.poolStatus.split(',');
          }
        }

        if (searchParams.poolStage) {
          if (Array.isArray(searchParams.poolStage)) {
            tmpBody.poolStage = searchParams.poolStage;
          } else {
            tmpBody.poolStage = searchParams.poolStage.split(',');
          }
        }

        if (searchParams.poolType) {
          if (Array.isArray(searchParams.poolType)) {
            tmpBody.poolType = searchParams.poolType;
          } else {
            tmpBody.poolType = searchParams.poolType.split(',');
          }
        }

        if (searchParams.isNilPool) {
          tmpBody.isNilPool = searchParams.isNilPool
        }

        tmpBody.offset = searchParams.page - 1 || 0;
        tmpBody.sortDirection = 'ASC';
        tmpBody.sortColumn = 'POOL_NO';

        return {
          uri: this.resource,
          body: replaceAllObjKeys(tmpBody, _.snakeCase),
          transform: basicDataTransform2
        }
    }
  });

})();
