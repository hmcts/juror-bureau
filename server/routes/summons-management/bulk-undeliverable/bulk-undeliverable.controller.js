const _ = require('lodash');
const { makeManualError } = require('../../../lib/mod-utils');
const { markAsUndeliverableDAO, jurorRecordDetailsDAO } = require('../../../objects');

module.exports.getBulkUndeliverable = (app) => {
  return (req, res) => {
    const tmpErrors = _.clone(req.session.errors);
    const bannerMessage = req.session.undeliverableJurorsBannerMessage;

    delete req.session.errors;
    delete req.session.undeliverableJurorsBannerMessage;

    return res.render('summons-management/bulk-undeliverable/bulk-undeliverable.njk', {
      currentUrl: '/bulk-undeliverable',
      bannerMessage,
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

    const jurorNumbers = Array.isArray(undeliverableJurors) ? undeliverableJurors : [undeliverableJurors];

    try {
      await markAsUndeliverableDAO.patch(req, { 'jurorNumbers': jurorNumbers });
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

module.exports.postFindJuror = (app) => {
  return async (req, res) => {
    const { jurorNumber } = req.body;
    let jurorDetails;

    const payload = {
      'jurorNumber': jurorNumber,
      include: [
        'NAME_DETAILS',
        'ADDRESS_DETAILS',
        'ACTIVE_POOL',
      ],
    };

    try {
      jurorDetails = await jurorRecordDetailsDAO.post(req, [payload]);
    } catch (err) {
      app.logger.crit('Failed to find juror', {
        auth: req.session.authentication,
        data: { payload },
        error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
      });

      return res.status(err.statusCode || 400).render('summons-management/bulk-undeliverable/table-row.njk', {
        rowData: {
          jurorNumber,
        },
        isFail: true,
      });
    }

    const address = Object.keys(jurorDetails[0].address).reduce((acc, key) => {
      if (jurorDetails[0].address[key] === null || key === 'postcode') {
        return acc;
      }

      acc.push(jurorDetails[0].address[key]);
      return acc;
    }, []).join('<br>');

    return res.render('summons-management/bulk-undeliverable/table-row.njk', {
      rowData: {
        jurorNumber,
        address,
        name: jurorDetails[0].name,
        postcode: jurorDetails[0].address.postcode,
        court: jurorDetails[0].activePool.courtName,
      },
    });
  };
};
