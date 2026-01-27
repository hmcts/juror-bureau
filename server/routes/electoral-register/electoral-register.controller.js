(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter } = require('../../components/filters');
  const { makeManualError } = require('../../lib/mod-utils');
  const { electoralRegisterDashboardDAO, localAuthoritiesDAO } = require('../../objects/electoral-register');

  module.exports.getDashboard = (app) => async (req, res) => {
    const { localAuthorityFilter, status } = req.query;

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    let allLocalAuthorities = [];
    try {
      allLocalAuthorities = (await localAuthoritiesDAO.get(req)).localAuthorities;
    } catch (err) {
      app.logger.crit('Error fetching all local authorities', {
        auth: req.session.authentication,
        error: err.message,
      });
    }

    let dashboardData = {};
    try {
      const payload = { localAuthorityFilter, status: status || 'all' };
      dashboardData = await electoralRegisterDashboardDAO.get(req, payload);
    } catch (err) {
      app.logger.crit('Error fetching electoral register dashboard data', {
        auth: req.session.authentication,
        error: err.message,
      });
    }

    const deadlineDiff = moment(new Date(dashboardData.deadline)).diff(moment(new Date()), 'days');

    return res.render('electoral-register/dashboard.njk', {
      postRoutes: {
        filter: app.namedRoutes.build('electoral-register.filter.post') 
          + buildQueryParams(status, localAuthorityFilter),
        sendReminder: app.namedRoutes.build('electoral-register.post') 
          + buildQueryParams(status, localAuthorityFilter, 'send-reminder'),
        markEmailDelivered: app.namedRoutes.build('electoral-register.post') 
          + buildQueryParams(status, localAuthorityFilter, 'mark-email-delivered'),
      },
      // TODO: ADD FLOWS TO THESE LINKS
      actionRoutes: {
        changeDeadline: '#',
        downloadEmails: '#',
      },
      showDeadlineWarrning: deadlineDiff <= 28,
      localAuthorityFilter,
      status: status || 'all',
      laAutoCompleteNames: allLocalAuthorities
        .sort((la1, la2) => la1.id - la2.id)
        .map((la) => la.authorityName),
      deadline: dateFilter(dashboardData.deadline, 'yyyy-MM-DD', 'DD MMMM yyyy'),
      daysRemaining: dashboardData.daysRemaining,
      notUploaded: dashboardData.notUploaded,
      uploaded: dashboardData.uploaded,
      localAuthorities: buildLocalAuthoritiesTable(dashboardData.localAuthorities),
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postLocalAuthorityFilter = (app) => (req, res) => {
    const { status }  = req.query;
    return res.redirect(
      app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, req.body.localAuthorityFilter)
    );
  };

  module.exports.postSelectedLocalAuthorities = (app) => (req, res) => {
    const { action, status, localAuthorityFilter } = req.query;
    

    if (!req.body.selectedAuthorities || req.body.selectedAuthorities.length === 0) {
      req.session.errors = makeManualError('selectedAuthorities', 'At least one authority must be selected');
      return res.redirect(
        app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityFilter)
      );
    }

    req.body.selectedAuthorities = Array.isArray(req.body.selectedAuthorities)
      ? req.body.selectedAuthorities
      : [req.body.selectedAuthorities];

    // TODO: Implement actual action handling logic for each option
    // LOCAL AUTHORITY IDs ARE STORED IN A LIST AT REQ.BODY.SELECTEDAUTHORITIES 
    switch (action) {
      case 'send-reminder':
        console.log(`\n\n--- Sending reminder emails to: ${req.body.selectedAuthorities} ---\n\n`);
        break;
      case 'mark-email-delivered':
        console.log(`\n\n--- Marking data request email as delivered for: ${req.body.selectedAuthorities} ---\n\n`);
        break;
      default:
        console.log(`\n\n--- No action specified for: ${req.body.selectedAuthorities} ---\n\n`);
    }

    return res.redirect(
      app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityFilter)
    );

  };

  const buildLocalAuthoritiesTable = (localAuthorities) => {
    const table = {
      head: [],
      rows: [],
    };

    table.head = [
      {
        html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items">'
            + '<input type="checkbox" class="govuk-checkboxes__input select-check authority-select-check" id="selectAllCheckbox" name="selectAllCheckbox"/>'
            + '<label class="govuk-label govuk-checkboxes__label" for="selectAllCheckbox">'
            + '<span class="govuk-visually-hidden">Select All</span>'
            + '</label>'
            + '</div>',
        classes: 'jd-middle-align',
      },
      {
        id: 'authorityName',
        text: 'Authority name',
        classes: 'jd-middle-align',
        attributes: {
          'aria-sort': 'ascending'
        }
      },
      {
        id: 'status',
        text: 'Status',
        classes: 'jd-middle-align',
        attributes: {
          'aria-sort': 'none'
        }
      },
      {
        id: 'lastDataUpload',
        text: 'Last data upload',
        classes: 'jd-middle-align',
        attributes: {
          'aria-sort': 'none'
        }
      }
    ];

    localAuthorities.forEach(function(localAuthority) {
      table.rows.push([
        {
          html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items" >'
            + `<input type="checkbox" class="govuk-checkboxes__input select-check authority-select-check" id="select-${localAuthority.id}" name="selectedAuthorities" value="${localAuthority.id}">`
            + `<label class="govuk-label govuk-checkboxes__label" for="select-${localAuthority.id}">`
            + `<span class="govuk-visually-hidden">Select ${localAuthority.id}</span>`
            + '</label>'
            + '</div>',
          classes: 'jd-middle-align',

        },
        {
          // TODO: Add link to authority details page
          html: `<a class='govuk-body govuk-link' href='#'>${localAuthority.authorityName}</a>`,
          classes: 'jd-middle-align',
        },
        {
          html: `<strong class="govuk-tag ${localAuthority.status === 'Not uploaded' ? 'govuk-tag--grey' : ''}">`
              + `${localAuthority.status}`
              + '</strong>',
          classes: 'jd-middle-align',
        },
        {
          text: dateFilter(localAuthority.lastDataUpload, 'yyyy-MM-DD', 'DD MMMM yyyy'),
          classes: 'jd-middle-align',
          attributes: {
            'data-sort-value': dateFilter(localAuthority.lastDataUpload, 'yyyy-MM-DD', 'yyyyMMDD')
          },
        }
      ]);
    });

    return table;
  };

  const buildQueryParams = (status, localAuthorityFilter, action) => {
    let queryParams = '';
    if (action) {
      queryParams += `?action=${action}`;
    }
    if (localAuthorityFilter) {
      queryParams += (queryParams.length ? '&' : '?') + `localAuthorityFilter=${localAuthorityFilter}`;
    }
    if (status) {
      queryParams += (queryParams.length ? '&' : '?') + `status=${status}`;
    }
    return queryParams;
  }

})();
