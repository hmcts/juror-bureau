const _ = require('lodash');
const validate = require('validate.js');
const urljoin = require('url-join');
const uncompleteValidator = require('../../config/validation/uncomplete-service');
const uncompleteJurorsearchObject = require('../../objects/uncomplete-juror').uncompleteJurorSearchObject;
const uncompleteJurorObject = require('../../objects/uncomplete-juror').uncompleteJurorObject;
const modUtils = require('../../lib/mod-utils');

module.exports.getUncompleteService = function (app) {
  return function (req, res) {
    const tmpErrors = _.cloneDeep(req.session.errors);
    const uncompleteConfirmed = req.session.uncompleteConfirmed;
    let tmpFields = {};

    if (Object.keys(req.query)[0]) {
      tmpFields.searchCompletedJurors = Object.keys(req.query)[0];
      switch (Object.keys(req.query)[0]) {
        case 'juror':
          tmpFields.searchByJuror = Object.values(req.query)[0];
          break;
        case 'pool':
          tmpFields.searchByPool = Object.values(req.query)[0];
          break;
        case 'name':
          tmpFields.searchByJurorName = Object.values(req.query)[0];
          break;
      }
    } else {
      tmpFields = _.cloneDeep(req.session.formFields);
    };

    delete req.session.formFields;
    delete req.session.errors;
    delete req.session.uncompleteService;
    delete req.session.uncompleteConfirmed;
    delete req.session.membersList;
    delete req.session.checkedJurors;

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

module.exports.postUncompleteService = function (app) {
  return function (req, res) {
    const redirectUrl = app.namedRoutes.build('sjo-tasks.uncomplete-service.select.get', {
      searchType: req.body.searchCompletedJurors,
    });
    let validatorResult;
    let searchTerm;

    switch (req.body.searchCompletedJurors) {
      case 'juror':
        searchTerm = req.body.searchByJuror;
        break;
      case 'pool':
        searchTerm = req.body.searchByPool;
        break;
      case 'name':
        searchTerm = req.body.searchByJurorName;
        break;
    }

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
    if (req.body.searchCompletedJurors === 'name') {

      validatorResult = validate(req.body, uncompleteValidator.searchByJurorName());
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
    const parameters = urlBuilder(req.body.searchCompletedJurors, searchTerm);

    return res.redirect(urljoin(redirectUrl, '?' + parameters));
  };
};

module.exports.getSelectUncomplete = function (app) {
  return async function (req, res) {
    const tmpErrors = _.cloneDeep(req.session.errors);
    const tmpUncompleteService = _.cloneDeep(req.session.uncompleteService);
    const backLinkUrl = app.namedRoutes.build('sjo-tasks.uncomplete-service.get');
    const changeUrl = urljoin(backLinkUrl, '?' + urlBuilder(Object.keys(req.query)[0], Object.values(req.query)[0]));
    const page = req.query['page'] || 1;
    let sortField;

    req.session.checkedJurors = tmpUncompleteService
      ? tmpUncompleteService.selectedJurors
      : (req.session.checkedJurors ? req.session.checkedJurors : []);

    delete req.session.errors;
    delete req.session.uncompleteService;
    delete req.session.membersList;

    try {

      switch (req.query['sortBy']) {
        case 'jurorNumber':
          sortField = 'JUROR_NUMBER';
          break;
        case 'firstName':
          sortField = 'FIRST_NAME';
          break;
        case 'lastName':
          sortField = 'LAST_NAME';
          break;
        case 'postcode':
          sortField = 'POSTCODE';
          break;
        case 'completionDate':
          sortField = 'COMPLETION_DATE';
          break;
      }

      req.session.searchOptions = {
        'juror_number': Object.keys(req.query)[0] === 'juror' ? Object.values(req.query)[0] : '',
        'juror_name': Object.keys(req.query)[0] === 'name' ? Object.values(req.query)[0] : '',
        'pool_number': Object.keys(req.query)[0] === 'pool' ? Object.values(req.query)[0] : '',
      };

      let payload = {
        ...req.session.searchOptions,
        'page_number': page,
        'page_limit': modUtils.constants.PAGE_SIZE,
        'sort_method': req.query['sortOrder'] === 'descending' ? 'DESC' : 'ASC',
        'sort_field': sortField,
      };

      let completedJurorsData = await uncompleteJurorsearchObject.post(
        require('request-promise'),
        app,
        req.session.authToken,
        payload,
      );

      req.session.membersList = completedJurorsData.data;
      let totalItems = completedJurorsData.total_items;

      app.logger.info('Fetched the the list of jurors to uncomplete: ', {
        auth: req.session.authentication,
        jwt: req.session.authToken,
      });
      let pageItems;

      if (totalItems > modUtils.constants.PAGE_SIZE) {
        pageItems = modUtils.paginationBuilder(totalItems, page, req.url);
      }

      const jurors = _.clone(req.session.membersList);
      const totalCheckedJurors = req.session.checkedJurors ? req.session.checkedJurors : [];
      const searchKey = Object.keys(req.query)[0];
      const searchTerm = Object.values(req.query)[0];
      const sortOrder = req.query['sortOrder'] || 'ascending';
      const sortBy = req.query['sortBy'] || 'jurorNumber';
      let completedJurorsList = modUtils.transformCompletedJurorsList(jurors, sortBy, sortOrder, totalCheckedJurors);
      let urlPrefix = '?' + searchKey + '=' + searchTerm + '&page=' + page;

      return res.render('sjo-tasks/uncomplete-service/select-jurors.njk', {
        backLinkUrl,
        changeUrl,
        postUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.select.post'),
        jurors,
        searchKey,
        searchTerm,
        totalItems,
        totalCheckedJurors: totalCheckedJurors.length,
        pageItems,
        completedJurorsList,
        urlPrefix,
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
      if (err.error.status === 404 || err.error.status === 422) {
        const overLimit = err.error.status === 422 ? true : false;

        return res.render('sjo-tasks/uncomplete-service/select-jurors.njk', {
          backLinkUrl,
          changeUrl,
          postUrl: app.namedRoutes.build('sjo-tasks.uncomplete-service.select.post'),
          jurors: [],
          searchKey: Object.keys(req.query)[0],
          searchTerm: Object.values(req.query)[0],
          overLimit,
          errors: {
            message: '',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      }
      return res.render('_errors/generic.njk');
    };
  };
};

module.exports.postSelectUncomplete = function (app) {
  return function (req, res) {
    let selectedJurors = _.clone(req.session.checkedJurors);

    if (selectedJurors.length < 1) {
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
    delete req.session.checkedJurors;

    return res.redirect(app.namedRoutes.build('sjo-tasks.uncomplete-service.confirm.get'));
  };
};

module.exports.getConfirmUncomplete = function (app) {
  return function (req, res) {
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
module.exports.postConfirmUncomplete = function (app) {
  return async function (req, res) {
    try {
      let payload = [];

      req.session.uncompleteService.selectedJurors.forEach(j => {
        payload.push(
          {
            'juror_number': j.juror_number,
            'pool_number': j.pool_number,
          });
      });


      await uncompleteJurorObject.patch(
        require('request-promise'),
        app,
        req.session.authToken
        , payload);

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

module.exports.postCheckJuror = function (app) {
  return async function (req, res) {
    const { jurorNumber, action } = req.query;

    if (!req.session.checkedJurors) {
      req.session.checkedJurors = [];
    }

    if (jurorNumber === 'check-all-jurors') {
      if (action === 'check') {
        // GET ALL POSSIBLE JURORS FOR SEARCH CRITERIA AND CHECK THEM
        try {
          let payload = {
            ...req.session.searchOptions,
            'page_number': '1',
            'page_limit': '500',
            'sort_method': 'ASC',
            'sort_field': 'JUROR_NUMBER',
          };

          let completedJurorsData = await uncompleteJurorsearchObject.post(
            require('request-promise'),
            app,
            req.session.authToken,
            payload,
          );

          app.logger.info('Fetched list of jurors', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            payload: payload,
          });

          req.session.checkedJurors = completedJurorsData.data.map((j) => {
            return {
              'juror_number': j['juror_number'],
              'pool_number': j['pool_number'],
            };
          });

        } catch (err) {
          app.logger.crit('Failed to fetch list of jurors: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }

      } else if (action === 'uncheck') {
        req.session.checkedJurors = [];
      }
    } else if (action === 'uncheck') {
      req.session.checkedJurors = req.session.checkedJurors.filter((j) => j['juror_number'] !== jurorNumber);
    } else {
      const juror = req.session.membersList.find(j => j['juror_number'] === jurorNumber);

      req.session.checkedJurors.push(
        {
          'juror_number': juror['juror_number'],
          'pool_number': juror['pool_number'],
        },
      );
    }
    app.logger.info('Checked or unchecked one or more jurors: ', {
      auth: req.session.authentication,
      jwt: req.session.authToken,
      data: {
        jurorNumber,
        action,
      },
    });
    return res.send(200, req.session.checkedJurors.length);
  };
};

function urlBuilder (searchKey, searchTerm) {
  if (searchKey === 'juror') {
    return ('juror=' + searchTerm);
  } else if (searchKey === 'name') {
    return ('name=' + searchTerm);
  } else if (searchKey === 'pool') {
    return ('pool=' + searchTerm);
  }
}
