const _ = require('lodash');
const validate = require('validate.js');
const urljoin = require('url-join').default;
const uncompleteValidator = require('../../config/validation/uncomplete-service');
const modUtils = require('../../lib/mod-utils');
const { sjoTasksSearchDAO } = require('../../objects');

module.exports.getSJOTasksSearch = function(app, { nav, title, searchLabel, postRoute, cancelRoute }) {
  return function(req, res) {
    const tmpErrors = _.cloneDeep(req.session.errors);
    const uncompleteConfirmed = req.session.uncompleteConfirmed;
    const undoFailedToAttend = req.session.undoFailedToAttend;
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
    delete req.session.undoFailedToAttend;
    delete req.session.uncompleteConfirmed;
    delete req.session.membersList;
    delete req.session.checkedJurors;

    return res.render('sjo-tasks/_common/search-form.njk', {
      nav,
      title,
      searchLabel,
      postUrl: app.namedRoutes.build(postRoute),
      cancelUrl: app.namedRoutes.build(cancelRoute),
      tmpFields,
      uncompleteConfirmed,
      undoFailedToAttend,
      errors: {
        message: '',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};

module.exports.postSJOTasksSearch = function(app, { continueRoute, redirectBackRoute }) {
  return function(req, res) {
    const redirectUrl = app.namedRoutes.build(continueRoute, {
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

      return res.redirect(app.namedRoutes.build(redirectBackRoute));
    };
    if (req.body.searchCompletedJurors === 'juror') {

      validatorResult = validate(req.body, uncompleteValidator.searchByJuror());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(redirectBackRoute));
      };
    };
    if (req.body.searchCompletedJurors === 'name') {

      validatorResult = validate(req.body, uncompleteValidator.searchByJurorName());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(redirectBackRoute));
      };
    };
    if (req.body.searchCompletedJurors === 'pool') {

      validatorResult = validate(req.body, uncompleteValidator.searchByPool());
      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build(redirectBackRoute));
      };
    };
    const parameters = urlBuilder(req.body.searchCompletedJurors, searchTerm);

    return res.redirect(urljoin(redirectUrl, '?' + parameters));
  };
};

module.exports.getSearchResults = function(app, { task, backLinkRoute, title, postRoute }) {
  return async function(req, res) {
    const tmpErrors = _.cloneDeep(req.session.errors);
    const tmpUncompleteService = _.cloneDeep(req.session.uncompleteService);

    const backLinkUrl = app.namedRoutes.build(backLinkRoute);
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

      if (task === 'uncomplete-service') {
        payload['juror_status'] = 13;
      }

      if (task === 'undo-failed-to-attend') {
        payload['juror_status'] = 12;
      }

      const completedJurorsData = await sjoTasksSearchDAO.post(req, payload);

      req.session.membersList = completedJurorsData.data;
      let totalItems = completedJurorsData.total_items;

      app.logger.info('Fetched the the list of jurors to uncomplete: ', {
        auth: req.session.authentication,
      });
      let pageItems;

      if (totalItems > modUtils.constants.PAGE_SIZE) {
        pageItems = modUtils.paginationBuilder(totalItems, page, req.url);
      }

      const jurors = _.clone(req.session.membersList);
      const totalCheckedJurors = req.session.checkedJurors ? req.session.checkedJurors : [];
      const searchKey =  Object.keys(req.query)[0];
      const searchTerm = Object.values(req.query)[0];
      const sortOrder = req.query['sortOrder'] || 'ascending';
      const sortBy = req.query['sortBy'] || 'jurorNumber';

      let completedJurorsList = modUtils
        .transformCompletedJurorsList(jurors, sortBy, sortOrder, totalCheckedJurors, task);
      let urlPrefix = '?' + searchKey + '=' + searchTerm + '&page=' + page;

      return res.render('sjo-tasks/_common/select-jurors.njk', {
        backLinkUrl,
        changeUrl,
        postUrl: app.namedRoutes.build(postRoute),
        title,
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
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });

      if (err.statusCode === 404 || err.statusCode === 422){
        const overLimit = err.statusCode === 422; // This might need to be checking for a string code

        return res.render('sjo-tasks/_common/select-jurors.njk', {
          backLinkUrl,
          changeUrl,
          postUrl: app.namedRoutes.build(postRoute),
          title,
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

      return res.render('_errors/generic', { err });
    };
  };
};

module.exports.postCheckJuror = function(app) {
  return async function(req, res) {
    const { jurorNumber, action, task } = req.query;

    if (!task) {
      app.logger.crit('Failed to check one or more jurors: ', {
        auth: req.session.authentication,
        error: 'Missing task query parameter',
      });

      return res.status(400).send({ errorCode: 'MISSING_TASK_QUERY_PARAM' });
    }

    if (!req.session.checkedJurors){
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

          if (task === 'uncomplete-service') {
            payload['juror_status'] = 13;
          }

          if (task === 'undo-failed-to-attend') {
            payload['juror_status'] = 12;
          }

          const completedJurorsData = await sjoTasksSearchDAO.post(req, payload);

          app.logger.info('Fetched list of jurors', {
            auth: req.session.authentication,
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
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.status(err.statusCode).send({ errorCode: 'FAILED_TO_FETCH_JURORS' });
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
        }
      );
    }

    app.logger.info('Checked or unchecked one or more jurors: ', {
      auth: req.session.authentication,
      data: {
        jurorNumber,
        action,
      },
    });

    return res.send(`${req.session.checkedJurors.length}`);
  };
};

function urlBuilder(searchKey, searchTerm) {
  if (searchKey === 'juror') {
    return ('juror=' + searchTerm);
  } else if (searchKey === 'name') {
    return ('name=' + searchTerm);
  } else if (searchKey === 'pool'){
    return ('pool=' + searchTerm);
  }
}

module.exports.urlBuilder = urlBuilder;
