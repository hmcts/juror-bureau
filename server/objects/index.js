;(function(){
  'use strict';

  module.exports.responses = require('./responses').object;

  // new DAOs
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
  const poolMembers = require('./pool-members');
  const reports = require('./reports');
  const summonsForm = require('./summons-form');
  const summonCitizens = require('./summon-citizens');
  const sjoTasks = require('./sjo-tasks');
  const jurorUndeliverable = require('./juror-undeliverable');

  module.exports = {
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
    ...poolMembers,
    ...reports,
    ...summonsForm,
    ...summonCitizens,
    ...sjoTasks,
    ...jurorUndeliverable,
  };

})();
