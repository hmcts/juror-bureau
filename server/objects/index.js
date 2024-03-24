;(function(){
  'use strict';

  const assign = require('./assign');
  const assignmentsMulti = require('./assignments-multi');
  const assignMulti = require('./assign-multi');
  const auth = require('./auth');
  const backlog = require('./backlog');
  const bureauDeferrals = require('./bureau-deferrals');
  const bureauStatus = require('./bureau-status');
  const completeService = require('./complete-service');
  const court = require('./court');
  const createTrial = require('./create-trial');
  const dashboard = require('./dashboard');
  const deferralAvailablePools = require('./deferral-available-pools');
  const deferralExcusal = require('./deferral-excusal-dashboard');
  const deferralMod = require('./deferral-mod');
  const deferralPreferredDates = require('./deferral-preferred-dates');
  const deferral = require('./deferral');
  const deletePool = require('./delete-pool');
  const dismissJurors = require('./dismiss-jurors');
  const disqualifyMod = require('./disqualify-mod');
  const disqualify = require('./disqualify');
  const editPool = require('./edit-pool');
  const excusalMod = require('./excusal-mod');
  const excusal = require('./excusal');
  const health = require('./health');
  const jurorAttendance = require('./juror-attendance');
  const jurorDeceased = require('./juror-deceased');
  const jurorRecord = require('./juror-record');
  const jurorTransfer = require('./juror-transfer');
  const jurorUndeliverable = require('./juror-undeliverable');
  const nilPool = require('./nil-pool');
  const paperReply = require('./paper-reply');
  const policeCheck = require('./police-check');
  const poolHistory = require('./pool-history');
  const poolList = require('./pool-list');
  const poolManagement = require('./pool-management');
  const poolMembers = require('./pool-members');
  const poolSearch = require('./pool-search');
  const poolSummary = require('./pool-summary');
  const postCodes = require('./postcodes');
  const postpone = require('./postpone');
  const reallocate = require('./reallocate');
  const requestPool = require('./request-pool');
  const responseDetail = require('./response-detail');
  const responseOverview = require('./response-overview');
  const responses = require('./responses');
  const search = require('./search');
  const sendCourt = require('./send-court');
  const smartSurveyExport = require('./smart-survey-export');
  const smartSurveyResponse = require('./smart-survey-response');
  const staffCreate = require('./staff-create');
  const staffRoster = require('./staff-roster');
  const staff = require('./staff');
  const status = require('./status');
  const summonCitizens = require('./summon-citizens');
  const summoningProgress = require('./summoning-progress');
  const summonsForm = require('./summons-form');
  const summonsManagement = require('./summons-management');
  const team = require('./team');

  module.exports = {
    ...assign,
    ...assignmentsMulti,
    ...assignMulti,
    ...auth,
    ...backlog,
    ...bureauDeferrals,
    ...bureauStatus,
    ...completeService,
    ...court,
    ...createTrial,
    ...dashboard,
    ...deferralAvailablePools,
    ...deferralExcusal,
    ...deferralMod,
    ...deferralPreferredDates,
    ...deferral,
    ...deletePool,
    ...dismissJurors,
    ...disqualifyMod,
    ...disqualify,
    ...editPool,
    ...excusalMod,
    ...excusal,
    ...health,
    ...jurorAttendance,
    ...jurorDeceased,
    ...jurorRecord,
    ...jurorTransfer,
    ...jurorUndeliverable,
    ...nilPool,
    ...paperReply,
    ...policeCheck,
    ...poolHistory,
    ...poolList,
    ...poolManagement,
    ...poolMembers,
    ...poolSearch,
    ...poolSummary,
    ...postCodes,
    ...postpone,
    ...reallocate,
    ...requestPool,
    ...responseDetail,
    ...responseOverview,
    ...responses,
    ...search,
    ...sendCourt,
    ...smartSurveyExport,
    ...smartSurveyResponse,
    ...staffCreate,
    ...staffRoster,
    ...staff,
    ...status,
    ...summonCitizens,
    ...summoningProgress,
    ...summonsForm,
    ...summonsManagement,
    ...team,
  };
})();
