(function () {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const modUtils = require('./mod-utils');

  const AGE_FAILURE_REASON = 'maximum age';

  async function fetchIneligibleJurorDetails (req, ineligibleJurors) {
    const { jurorRecordDetailsDAO } = require('../objects/juror-record');
    const payload = ineligibleJurors.map(({ jurorNumber }) => ({
      'juror_number': jurorNumber,
      'juror_version': null,
      include: ['NAME_DETAILS', 'ACTIVE_POOL'],
    }));

    const jurorDetails = await jurorRecordDetailsDAO.post(req, payload);

    return modUtils.replaceAllObjKeys(Object.values(_.omit(jurorDetails, '_headers')), _.camelCase);
  }

  async function fetchAndMergeIneligibleJurorDetails (req, ineligibleJurors) {
    const jurorDetails = await fetchIneligibleJurorDetails(req, ineligibleJurors);

    const jurorDetailsByNumber = new Map(
      jurorDetails.map(juror => [juror.jurorNumber, juror]),
    );

    return ineligibleJurors.map((juror) => {
      const mergedJurorDetails = {
        ...juror,
        ...jurorDetailsByNumber.get(juror.jurorNumber),
      };

      return {
        ...mergedJurorDetails,
        ageOnNewDate: moment(mergedJurorDetails.newDate, 'DD/MM/YYYY')
          .diff(moment(mergedJurorDetails.dob, 'DD/MM/YYYY'), 'years'),
      };
    });
  }

  async function bulkDisqualifyByAge (req, jurorNumbers) {
    const { bulkDisqualifyJurorsDAO } = require('../objects/disqualify-mod');

    return bulkDisqualifyJurorsDAO.post(req, {
      jurorNumbers: Array.isArray(jurorNumbers) ? jurorNumbers : [jurorNumbers],
    });
  }

  function removeAgeDisqualifiedJurorsFromMovementData (movementData) {
    if (!movementData?.unavailableForMove?.length) {
      return movementData;
    }

    const movedJurors = movementData.unavailableForMove
      .filter(juror => juror.failureReason?.includes(AGE_FAILURE_REASON))
      .map(juror => juror.jurorNumber);

    movementData.availableForMove = Array.from(new Set([
      ...(movementData.availableForMove || []),
      ...movedJurors,
    ]));
    movementData.unavailableForMove = movementData.unavailableForMove.filter(
      juror => !juror.failureReason?.includes(AGE_FAILURE_REASON),
    );

    return movementData;
  }

  module.exports = {
    bulkDisqualifyByAge,
    fetchAndMergeIneligibleJurorDetails,
    removeAgeDisqualifiedJurorsFromMovementData,
  };
})();
