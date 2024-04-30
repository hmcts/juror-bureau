;(function(){
  'use strict';

  module.exports.responses = require('./responses').object;

  // new DAOs
  const authentication = require('./authentication');
  const requestPool = require('./request-pool');
  const panel = require('./panel');
  const jurorsOnTrial = require('./jurors-on-trial');
  const administration = require('./administration');
  const confirmIdentity = require('./confirm-identity');
  const status = require('./status');
  const jurorRecord = require('./juror-record');
  const jurorAttendance = require('./juror-attendance');
  const createTrial = require('./create-trial');
  const policeCheck = require('./police-check');
  const coronerPools = require('./coroner-pools');

  module.exports = {
    ...authentication,
    ...requestPool,
    ...panel,
    ...jurorsOnTrial,
    ...administration,
    ...confirmIdentity,
    ...status,
    ...jurorRecord,
    ...jurorAttendance,
    ...createTrial,
    ...policeCheck,
    ...coronerPools,
  };

})();
