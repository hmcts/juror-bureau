const _ = require('lodash');
const urljoin = require('url-join');
const { urlBuilder } = require('./sjo-tasks.controller');
const { makeManualError } = require('../../lib/mod-utils');
const { uncompleteJurorDAO } = require('../../objects');

module.exports.postSelectUncomplete = function(app) {
  return function(req, res) {
    let selectedJurors = _.clone(req.session.checkedJurors);

    if (!selectedJurors.length) {
      req.session.errors = makeManualError('selectableJurors', 'Select at least one juror to uncomplete');

      return res.redirect(urljoin(app.namedRoutes.build('sjo-tasks.uncomplete-service.select.get'),
        '?' + urlBuilder(req.body.searchKey, req.body.searchTerm)));
    };

    req.session.uncompleteService = _.cloneDeep(req.body);
    req.session.uncompleteService.selectedJurors = selectedJurors;
    if (!Array.isArray(selectedJurors)) {
      req.session.uncompleteService.selectedJurors = [selectedJurors];
    }
    delete req.session.uncompleteService._csrf;
    delete req.session.membersList;
    delete req.session.checkedJurors;

    return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.confirm.get'));
  };
};

module.exports.getConfirmUncomplete = function(app) {
  return function(req, res) {
    const backLinkUrl = urljoin(app.namedRoutes.build('sjo-tasks.uncomplete-service.select.get'),
      '?' + urlBuilder(req.session.uncompleteService.searchKey, req.session.uncompleteService.searchTerm));

    return res.render('sjo-tasks/uncomplete-service/confirm-uncomplete.njk', {
      backLinkUrl,
      postUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.confirm.post'),
      cancelUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.get'),
      jurorsAmount: req.session.uncompleteService.selectedJurors.length,
    });
  };
};

module.exports.postConfirmUncomplete = function(app) {
  return async function(req, res) {
    try {
      let payload = [];

      req.session.uncompleteService.selectedJurors.forEach(j => {
        payload.push(
          {
            'juror_number': j.juror_number,
            'pool_number': j.pool_number,
          });
      });

      await uncompleteJurorDAO.patch(req, payload);

      req.session.uncompleteConfirmed = req.session.uncompleteService.selectedJurors.length;
      delete req.session.uncompleteService;

      return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.get'));
    } catch (err) {
      app.logger.crit('Unable to uncomplete service', {
        auth: req.session.authentication,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      return res.render('_errors/generic.njk');
    };
  };
};