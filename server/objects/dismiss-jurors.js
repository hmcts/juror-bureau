/* eslint-disable strict */
'use strict';
const { DAO } = require('./dataAccessObject');

module.exports.getPoolsDAO = new DAO('moj/juror-management/dismiss-jurors/pools', {
  // TODO: remove once back end code is ready
  get: function() {
    const { pools } = require('../stores/dismiss-jurors');

    return {debug: Promise.resolve(pools)};
  }}
);

module.exports.getJurorsDAO = new DAO('moj/juror-management/dismiss-jurors/jurors', {
  // TODO: remove once back end code is ready
  get: function(req, params) {
    const { jurors } = require('../stores/dismiss-jurors');
    let _jurors = jurors.filter(juror => juror['attending'] === 'In attendance');

    if (params['jurors-to-include'] &&
      (params['jurors-to-include'] === 'on-call'
        || params['jurors-to-include'].includes('on-call'))) {
      _jurors.push(...jurors.filter(juror => juror['attending'] === 'On call'));
    }

    if (params['jurors-to-include'] &&
      (params['jurors-to-incldue'] === 'not-in-attendance'
        || params['jurors-to-include'].includes('not-in-attendance'))) {
      _jurors.push(...jurors.filter(juror => juror['attending'] === 'Other'));
    }

    _jurors = randomizer(_jurors, _jurors.length);

    return {debug: Promise.resolve(_jurors.slice(0, params.jurorsToDismiss))};
  }}
);

// This is temp for randomizing my list of jurors. the backend will do this when ready
function randomizer(arr, length) {
  const crypto = require('crypto');
  const randomized = [];

  for (let i = 0; i < length; i++) {
    const random = crypto.randomInt(arr.length);

    randomized.push(arr[random]);
    arr.splice(random, 1);
  }

  return randomized;
}
