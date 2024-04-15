/* eslint-disable strict */

const _ = require('lodash');
const validate = require('validate.js');
const disqualifyValidator = require('../../../config/validation/disqualify-mod');
const { getDisqualificationReasons, disqualifyJuror } = require('../../../objects/disqualify-mod');

module.exports.getDisqualifyJurorRecord = function(app) {
  return async function(req, res) {
    const { jurorNumber } = req.params;

    const postUrl = app.namedRoutes.build('juror.update.disqualify.post', { jurorNumber });
    const cancelUrl = app.namedRoutes.build('juror.update.get', { jurorNumber });

    let disqualifyReasons;

    try {
      const response = await getDisqualificationReasons.get(null, app, req.session.authToken);

      disqualifyReasons = response.disqualifyReasons;
    } catch (err) {
      console.log(err);
      return;
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
        null,
        app,
        req.session.authToken,
        jurorNumber,
        req.body.disqualifyReason,
        type
      );
    } catch (err) {
      console.log(err);
      return;
    }

    return res.redirect(app.namedRoutes.build('juror-record.overview.get', { jurorNumber }));
  };
};
