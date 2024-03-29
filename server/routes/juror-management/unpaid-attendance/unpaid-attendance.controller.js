const _ = require('lodash');
const modUtils = require('../../../lib/mod-utils');
const validate = require('validate.js');
const urljoin = require('url-join');
const fetchUnpaidExpenses = require('../../../objects/expenses').fetchUnpaidExpenses;
const unpaidAttendanceFilterValidation = require('../../../config/validation/unpaid-attendance');

module.exports.getUnpaidAttendance = function (app) {
  return function (req, res) {
    const currentPage = req.query['page'] || 1;
    const minDate = req.query['filterStartDate'] || null;
    const maxDate = req.query['filterEndDate'] || null;
    const sortOrder = req.query['sortOrder'] || 'ascending';
    const sortBy = req.query['sortBy'] || 'unpaidLastName';
    const tmpErrors = _.clone(req.session.errors);

    const successCB = function (data) {
      const listToRender = modUtils.transformUnpaidAttendanceList(data.content, sortBy, sortOrder);
      let pageItems;
      let errors;

      delete req.session.errors;

      if (tmpErrors) {
        errors = {
          title: 'There is a problem',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        };
        req.session.unpaidAttendanceTotal = 0;
      } else {
        req.session.unpaidAttendanceTotal = data.totalElements;
      }

      if (req.session.unpaidAttendanceTotal > modUtils.constants.PAGE_SIZE) {
        pageItems = modUtils.paginationBuilder(req.session.unpaidAttendanceTotal, currentPage, req.url);
      }

      const pageUrls = {
        clearFilter: urlBuilder(req.query, true),
      };

      const filters = {
        filterStartDate: req.query['filterStartDate'],
        filterEndDate: req.query['filterEndDate'],
      };

      return res.render('juror-management/unpaid-attendance.njk', {
        unpaidAttendanceList: listToRender,
        currentTab: 'unpaid-attendance',
        pageItems,
        totalAttendance: req.session.unpaidAttendanceTotal,
        errors,
        pageUrls,
        filters,
      });
    };

    const opts = {
      pageNumber: currentPage - 1,
      sortBy: 'lastName',
      sortOrder: sortOrder === 'ascending' ? 'ASC' : 'DESC',
      minDate,
      maxDate,
    };

    delete req.session.expensesList;

    fetchUnpaidExpenses.get(
      app,
      req.session.authToken,
      req.session.authentication.owner,
      opts,
    )
      .then(successCB);
  };
};

module.exports.postUnpaidAttendance = function (app) {
  return function (req, res) {

    const redirectUrl = app.namedRoutes.build('juror-management.unpaid-attendance.get');
    const validateFilter = validate(req.body, unpaidAttendanceFilterValidation());

    delete req.session.errors;

    if (typeof validateFilter !== 'undefined') {
      req.session.errors = validateFilter;
    }
    return res.redirect(urljoin(redirectUrl, urlBuilder(req.body)));
  };
};

function urlBuilder (params, clearFilter = false) {
  const parameters = [];

  if (params.page) {
    parameters.push('page=' + params.page);
  }

  if (!clearFilter) {
    if (params.filterStartDate) {
      parameters.push('filterStartDate=' + params.filterStartDate);
    }

    if (params.filterEndDate) {
      parameters.push('filterEndDate=' + params.filterEndDate);
    }
  } else {
    parameters.push('clearFilter=true');
  }

  return '?' + parameters.join('&');
}
