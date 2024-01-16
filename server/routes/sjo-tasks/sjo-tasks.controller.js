(function() {
  'use strict';

  const _ = require('lodash')
    , validate = require('validate.js')
    , urljoin = require('url-join')
    , uncompleteValidator = require('../../config/validation/uncomplete-service')
    , completedJurorsMockData = require('../../stores/completed-jurors')
    , modUtils = require('../../lib/mod-utils');

  module.exports.getUncompleteService = function(app) {
    return function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const uncompleteConfirmed = req.session.uncompleteConfirmed;
      let tmpFields = {};

      if (Object.keys(req.query)[0]) {
        tmpFields.searchCompletedJurors = Object.keys(req.query)[0];
        Object.keys(req.query)[0] === 'juror' ?
          tmpFields.searchByJuror = Object.values(req.query)[0] : tmpFields.searchByPool = Object.values(req.query)[0];
      } else {
        tmpFields = _.cloneDeep(req.session.formFields);
      };

      delete req.session.formFields;
      delete req.session.errors;
      delete req.session.uncompleteService;
      delete req.session.uncompleteConfirmed;
      delete req.session.membersList;

      return res.render('sjo-tasks/uncomplete-service/index.njk', {
        nav: 'uncomplete',
        postUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.post'),
        cancelUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.get'),
        tmpFields,
        uncompleteConfirmed,
        errors: {
          message: '',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postUncompleteService = function(app) {
    return function(req, res) {
      const redirectUrl = app.namedRoutes.build('sjo-tasks.uncomplete-service.select.get', {
        searchType: req.body.searchCompletedJurors,
      });
      let validatorResult;

      validatorResult = validate(req.body, uncompleteValidator.searchOptions());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.get'));
      };
      if (req.body.searchCompletedJurors === 'juror') {

        validatorResult = validate(req.body, uncompleteValidator.searchByJuror());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.get'));
        };
      };
      if (req.body.searchCompletedJurors === 'pool') {

        validatorResult = validate(req.body, uncompleteValidator.searchByPool());
        if (typeof validatorResult !== 'undefined') {
          req.session.errors = validatorResult;
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.get'));
        };
      };

      const parameters = urlBuilder(req.body.searchCompletedJurors,
        req.body.searchByJuror ? req.body.searchByJuror : req.body.searchByPool);

      return res.redirect(urljoin(redirectUrl, '?' + parameters));
    };
  };

  module.exports.getSelectUncomplete = function(app) {
    return async function(req, res) {
      const tmpErrors = _.cloneDeep(req.session.errors);
      const backLinkUrl = app.namedRoutes.build('sjo-tasks.uncomplete-service.get');
      const changeUrl = urljoin(backLinkUrl, '?' + urlBuilder(Object.keys(req.query)[0], Object.values(req.query)[0]));

      delete req.session.errors;

      try {
        if (!req.session.membersList) {
          req.session.membersList = await searchResolver(Object.keys(req.query)[0], Object.values(req.query)[0]);

          app.logger.info('Fetched the the list of jurors to uncomplete: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
          });
        }

        const totalJurors = req.session.membersList.length;
        const totalCheckedJurors = req.session.membersList.filter(juror => juror.checked).length;
        const page = req.query['page'] || 1;
        let pageItems;

        let start = 0;
        let end = req.session.membersList.length;

        if (page > 1) {
          start = (page - 1) * modUtils.constants.PAGE_SIZE;
        }
        if (req.session.membersList.length > modUtils.constants.PAGE_SIZE) {
          end = start + modUtils.constants.PAGE_SIZE;
          pageItems = modUtils.paginationBuilder(req.session.membersList.length, page, req.url);
        }

        const jurors = _.clone(req.session.membersList).slice(start, end);

        return res.render('sjo-tasks/uncomplete-service/select-jurors.njk', {
          backLinkUrl,
          changeUrl,
          postUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.select.post'),
          jurors: jurors,
          searchKey: Object.keys(req.query)[0],
          searchTerm: Object.values(req.query)[0],
          totalJurors,
          totalCheckedJurors,
          pageItems,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to search', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.postSelectUncomplete = function(app) {
    return function(req, res) {

      let selectedJurors = _.clone(req.session.membersList).filter(juror => juror.checked);

      if (typeof selectedJurors === 'undefined') {
        req.session.errors = {
          selectedJurors: [
            {
              details: 'Select at least one juror to uncomplete',
              summary: 'Select at least one juror to uncomplete',
            },
          ],
        };
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
        await resolver();

        req.session.uncompleteConfirmed = req.session.uncompleteService.selectedJurors.length;
        delete req.session.uncompleteService;

        return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.get'));
      } catch (err) {
        app.logger.crit('Unable to uncomplete service', {
          auth: req.session.authentication,
          token: req.session.authToken,
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      };
    };
  };

  module.exports.postCheckJuror = function(app) {
    return function(req, res) {
      const { jurorNumber, action } = req.query;

      if (jurorNumber === 'check-all-jurors') {
        req.session.membersList.forEach(j => {
          j.checked = action === 'check';
        });
      } else {
        const juror = req.session.membersList.find(j => j.jurorNumber === jurorNumber);

        juror.checked = !juror.checked;
      }

      app.logger.info('Checked or unchecked one or more jurors: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
        data: {
          jurorNumber,
          action,
        },
      });

      return res.send();
    };
  };

  function urlBuilder(searchKey, searchTerm) {
    if (searchKey === 'juror') {
      return ('juror=' + searchTerm);
    }
    return ('pool=' + searchTerm);
  }

  // TODO: delete both resolvers once BE is ready
  function searchResolver(searchKey, searchTerm) {
    if (searchKey === 'juror' && searchTerm === 'John'){
      return new Promise(res => res([completedJurorsMockData[0]]));
    };
    if (searchTerm === 'Jane'){
      return new Promise(res => res([]));
    };
    return new Promise(res => res(completedJurorsMockData));
  };
  function resolver() {
    return new Promise(res => res(''));
  };

})();
