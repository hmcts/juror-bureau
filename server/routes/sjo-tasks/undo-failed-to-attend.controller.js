const _ = require('lodash');
const { makeManualError } = require('../../lib/mod-utils');
const { urlBuilder } = require('./sjo-tasks.controller');
const { undoFailedToAttendDAO } = require('../../objects');

module.exports.postSelectUndoFailedToAttend = (app) => {
  return (req, res) => {
    const selectedJurors = _.clone(req.session.checkedJurors);

    if (!selectedJurors.length) {
      req.session.errors = makeManualError('selectableJurors',
        'Select at least one juror to undo their failed to attend status');

      return res.redirect(app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.select.get')
        + '?' + urlBuilder(req.body.searchKey, req.body.searchTerm));
    }

    req.session.undoFailedToAttend = _.clone(req.body);
    req.session.undoFailedToAttend.selectedJurors = Array.isArray(selectedJurors) ? selectedJurors : [selectedJurors];

    delete req.session.undoFailedToAttend._csrf;
    delete req.session.membersList;
    delete req.session.checkedJurors;

    return res.redirect(app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.confirm.get'));
  };
};

module.exports.getConfirmUndoFailedToAttend = (app) => {
  return (req, res) => {
    const backLinkUrl = app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.select.get')
      + '?' + urlBuilder(req.session.undoFailedToAttend.searchKey, req.session.undoFailedToAttend.searchTerm);

    return res.render('sjo-tasks/undo-failed-to-attend/confirm-undo-failed-to-attend.njk', {
      backLinkUrl,
      postUrl: app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.confirm.post'),
      cancelUrl: app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.get'),
      jurorsAmount: req.session.undoFailedToAttend.selectedJurors.length,
    });
  };
};

module.exports.postConfirmUndoFailedToAttend = (app) => {
  return async (req, res) => {

    const payload = req.session.undoFailedToAttend.selectedJurors.map(j => ({
      juror_number: j.juror_number,
      pool_number: j.pool_number,
    }));

    try {
      await undoFailedToAttendDAO.patch(req, payload);
    } catch (err) {
      app.logger.crit('Failed to undo failed-to-attend status', {
        auth: req.session.authentication,
        data: { payload },
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic');
    }

    // still use the uncompleteConfirmed key for using the same logic
    req.session.uncompleteConfirmed = req.session.undoFailedToAttend.selectedJurors.length;
    delete req.session.undoFailedToAttend;

    return res.redirect(app.namedRoutes.build('sjo-tasks.undo-failed-to-attend.get'));
  };
};
