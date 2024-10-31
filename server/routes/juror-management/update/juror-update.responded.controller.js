/* eslint-disable strict */

const _ = require('lodash');
const validate = require('validate.js');
const respondedValidator = require('../../../config/validation/responded');
const { makeManualError } = require('../../../lib/mod-utils');
const { updateStatusDAO, markAsRespondedDAO } = require('../../../objects');
const { updateStatus } = require('../../../objects/summons-management');
const { Logger } = require('../../../components/logger');

module.exports.getResponded = function(app) {
  return function(req, res) {
    const { jurorNumber } = req.params;
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    const postUrl = app.namedRoutes.build('juror.update.responded.post', {
      jurorNumber,
    });
    const cancelUrl = app.namedRoutes.build('juror.update.get', { jurorNumber });

    return res.render('response/process/responded.njk', {
      postUrl: postUrl,
      cancelUrl: cancelUrl,
      jurorNumber,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postResponded = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const backUrl = app.namedRoutes.build('juror.update.responded.get', {
      jurorNumber,
    });
    const validationErrors = validate(req.body, respondedValidator());

    if (validationErrors) {
      req.session.errors = validationErrors;

      return res.redirect(backUrl);
    }

    if (jurorNumber !== req.body.jurorNumber) {
      req.session.errors = makeManualError('jurorNumber', 'BVR - Juror number does not match');

      return res.redirect(backUrl);
    }

    const payload = {
      jurorNumber,
      status: 'CLOSED',
    };

    try {
      switch (req.session.replyMethod) {
      case 'DIGITAL':
        await updateStatusDAO.post(req, jurorNumber, payload);
        break;
      case 'PAPER':
        await updateStatus.put(req, jurorNumber, 'CLOSED');
        break;
      default:
        await markAsRespondedDAO.patch(req, jurorNumber);
        break;
      };

      Logger.instance.info('Successfully marked a record as responded', {
        auth: req.session.authentication,
        data: { ...payload },
      });
    } catch (err) {
      Logger.instance.crit('Failed to update', {
        auth: req.session.authentication,
        data: { ...payload },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      if (err.statusCode === 409) {
        req.session.errors = makeManualError('jurorNumber', 'Juror record has been updated by another user');
      } else if (err.statusCode === 422) {
        if (err.error.code === 'JUROR_DATE_OF_BIRTH_REQUIRED') {
          req.session.errors = makeManualError('jurorNumber', 'Juror date of birth is required to mark as responded');
        }
      } else {
        req.session.errors =
          makeManualError('jurorNumber', 'Something went wrong when trying to update the juror record');
      }

      return res.redirect(backUrl);
    }

    req.session.bannerMessage = 'Juror record has been updated';

    return res.redirect(app.namedRoutes.build('juror-record.summons.get', { jurorNumber }));
  };
};
