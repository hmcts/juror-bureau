const _ = require('lodash');
const { makeManualError } = require('../../../lib/mod-utils');
const { markAsUndeliverableDAO } = require('../../../objects');

module.exports.getBulkUndeliverable = (app) => {
  return (req, res) => {
    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;
    delete req.session.undeliverableJurorsBannerMessage;

    return res.render('summons-management/bulk-undeliverable/bulk-undeliverable.njk', {
      currentUrl: '/bulk-undeliverable',
      bannerMessage: req.session.undeliverableJurorsBannerMessage,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postBulkUndeliverable = (app) => {
  return async (req, res) => {
    const { undeliverableJurors } = req.body;

    if (!undeliverableJurors || undeliverableJurors === '') {
      req.session.errors = makeManualError('undeliverableJurors', 'You must enter at least one juror number');

      return res.redirect(app.namedRoutes.build('summons-management.bulk-undeliverable.get'));
    }

    const jurorNumbers = undeliverableJurors.trim().split(' ');

    try {
      await markAsUndeliverableDAO.patch(req, { 'juror_numbers': jurorNumbers });
    } catch (err) {
      app.logger.crit('Failed to mark jurors as undeliverable', {
        auth: req.session.authentication,
        data: { jurorNumbers },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    req.session.undeliverableJurorsBannerMessage = `Marked ${jurorNumbers.length} jurors as undeliverable`;

    return res.redirect(app.namedRoutes.build('summons-management.bulk-undeliverable.get'));
  };
};
