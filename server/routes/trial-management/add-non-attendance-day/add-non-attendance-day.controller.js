(() => {
  'use strict';

  const _ = require('lodash');
  const validate = require('validate.js');
  const { makeManualError } = require('../../../lib/mod-utils');

  module.exports.postAddNonAttendance = (app) => async (req, res) => {
    const { trialNumber, locationCode } = req.params;
    delete req.session.formFields;

    if (!req.body.selectedJurors) {
      req.session.errors = makeManualError('selectedJurors', 'Please select at least one juror to add a non attendance day for');
      req.session.formFields = req.body;

      return res.redirect(app.namedRoutes.build('trial-management.trials.detail.get', {
        trialNumber,
        locationCode,
      }));
    }

    if (!Array.isArray(req.body.selectedJurors)) {
      req.body.selectedJurors = [req.body.selectedJurors];
    }

    req.session[`${trialNumber}-${locationCode}-nonAttendanceDay`] = {
      selectedJurors: req.body.selectedJurors,
    }

    return res.redirect(app.namedRoutes.build('trial-management.trials.add-non-attendance-day.get', {
      trialNumber,
      locationCode,
    }));
  };

})();