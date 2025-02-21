/* eslint-disable strict */

const _ = require('lodash');
const validate = require('validate.js');
const disqualifyValidator = require('../../../config/validation/disqualify-mod');
const { getDisqualificationReasons, disqualifyJuror } = require('../../../objects/disqualify-mod');
const { Logger } = require('../../../components/logger');
const { makeManualError } = require('../../../lib/mod-utils');
const { flowLetterGet, flowLetterPost } = require('../../../lib/flowLetter');

module.exports.getDisqualifyJurorRecord = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const postUrl = app.namedRoutes.build('juror.update.disqualify.post', { jurorNumber });
    const cancelUrl = app.namedRoutes.build('juror.update.get', { jurorNumber });

    let disqualifyReasons;

    try {
      const response = await getDisqualificationReasons.get(req);

      disqualifyReasons = response.disqualifyReasons;
    } catch (err) {
      Logger.instance.crit('Failed to fetch the disqualification reasons', {
        auth: req.session.authentication,
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic', { err });
    }

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    return res.render('summons-management/process-reply/disqualify', {
      postUrl,
      cancelUrl,
      disqualifyReasons,
      errors: {
        message: '',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postDisqualifyJurorRecord = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const validationResult = validate(req.body, disqualifyValidator());

    if (validationResult) {
      req.session.errors = validationResult;

      return res.redirect(app.namedRoutes.build('juror.update.disqualify.get', { jurorNumber }));
    }

    const type = req.session.replyMethod || 'NONE';

    try {
      await disqualifyJuror.patch(
        req,
        jurorNumber,
        req.body.disqualifyReason,
        type
      );

      Logger.instance.info('Successfully disqualified the juror', {
        auth: req.session.authentication,
        data: { jurorNumber, reason: req.body.disqualifyReason, replyMethod: type },
      });

    } catch (err) {
      Logger.instance.crit('Failed to disqualify the juror', {
        auth: req.session.authentication,
        data: { jurorNumber, reason: req.body.disqualifyReason, replyMethod: type },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      req.session.errors = makeManualError('disqualify', 'Something went wrong when trying to disqualify the juror');

      return res.redirect(app.namedRoutes.build('juror.update.disqualify.get', { jurorNumber }));
    }

    req.session.bannerMessage = 'Disqualified';

    if (res.locals.isCourtUser) {
      return res.redirect(app.namedRoutes.build('juror.update.disqualify.letter.get', {
        jurorNumber: req.params.jurorNumber,
      }));
    }

    return res.redirect(app.namedRoutes.build('juror-record.overview.get', { jurorNumber }));
  };
};

module.exports.getDisqualifyLetter = function(app) {
  return function(req, res) {
    return flowLetterGet(req, res, {
      serviceTitle: 'send letter',
      pageIdentifier: 'process - disqualify',
      currentApp: '',
      letterMessage: 'a disqualification',
      letterType: 'withdrawal',
      postUrl: app.namedRoutes.build('juror.update.disqualify.letter.post', {
        jurorNumber: req.params.jurorNumber,
      }),
      cancelUrl: app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params.jurorNumber,
      }),
    });
  };
};

module.exports.postDisqualifyLetter = function(app) {
  return function(req, res) {
    return flowLetterPost(req, res, {
      errorRoute: app.namedRoutes.build('juror.update.disqualify.letter.get', {
        jurorNumber: req.params.jurorNumber,
      }),
      pageIdentifier: 'process - disqualify',
      serviceTitle: 'send letter',
      currentApp: '',
      completeRoute: app.namedRoutes.build('juror-record.overview.get', {
        jurorNumber: req.params.jurorNumber,
      }),
    });
  };
};
