/* eslint-disable strict */
'use strict';

const { DAO } = require('./dataAccessObject');
const utils = require('../lib/utils');

module.exports.getJurorsObject = new DAO('moj/juror-management/jurors-to-dismiss', {
  post: function(params, locCode) {
    const jurorsToInclude = params['jurors-to-include'] instanceof Array
      ? params['jurors-to-include']
      : [params['jurors-to-include']];

    const body = {
      'pool_numbers': params['checked-pools'] instanceof Array
        ? params['checked-pools']
        : [params['checked-pools']],
      'location_code': locCode,
      'number_of_jurors_to_dismiss': params['jurorsToDismiss'],
      'include_jurors_on_call': jurorsToInclude.includes('on-call') ? true : false,
      'include_jurors_not_in_attendance': jurorsToInclude.includes('not-in-attendance') ? true : false,
    }

    return {
      uri: this.resource,
      body,
      transform: utils.basicDataTransform,
    }
  }
});

module.exports.dismissJurorsObject = new DAO('moj/complete-service/dismissal');
