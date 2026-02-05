(() => {
  'use strict';

  const _ = require('lodash');
  const moment = require('moment');
  const { dateFilter, toSentenceCase } = require('../../components/filters');
  const { makeManualError } = require('../../lib/mod-utils');
  const { erLocalAuthorityStatusDAO, localAuthoritiesDAO, erUploadStats } = require('../../objects/electoral-register');

  module.exports.getDashboard = (app) => async (req, res) => {
    const { localAuthorityFilter, status } = req.query;

    const tmpErrors = _.clone(req.session.errors);
    const bannerMessage = _.clone(req.session.bannerMessage);

    delete req.session.errors;
    delete req.session.bannerMessage;

    let allLocalAuthorities = [];
    if (!req.session.localAuthorities) {
      try {
        allLocalAuthorities = (await localAuthoritiesDAO.get(req)).localAuthorities;
        req.session.localAuthorities = allLocalAuthorities; // Store in session for later use if needed
      } catch (err) {
        app.logger.crit('Error fetching all local authorities', {
          auth: req.session.authentication,
          error: err.message,
        });
      }
    } else {
      allLocalAuthorities = req.session.localAuthorities;
    }

    const selectedLocalAuthority = localAuthorityFilter 
      ? allLocalAuthorities.find(la => la.localAuthorityCode === localAuthorityFilter)?.localAuthorityName
      : null;

    let uploadStats = {};
    try {
      uploadStats = await erUploadStats.get(req);
    } catch (err) {
      app.logger.crit('Error fetching electoral register upload stats', {
        auth: req.session.authentication,
        error: err.message,
      });
    }

    let localAuthorityStatus = {};
    try {
      const payload = { 
        localAuthorityCode: localAuthorityFilter,
        uploadStatus: !status || status === 'all'
          ? ['UPLOADED', 'NOT_UPLOADED']
          : [_.snakeCase(status).toUpperCase()]
      };
      localAuthorityStatus = await erLocalAuthorityStatusDAO.post(req, payload);
    } catch (err) {
      app.logger.crit('Error fetching electoral register dashboard data', {
        auth: req.session.authentication,
        error: err.message,
      });
    }

    const deadlineDiff = moment(new Date(uploadStats.deadlineDate)).diff(moment(new Date()), 'days');

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
      selectedLocalAuthority,
      status: status || 'all',
      laAutoCompleteNames: allLocalAuthorities
        .sort((la1, la2) => la1.id - la2.id)
        .map((la) => la.localAuthorityName),
      deadline: dateFilter(uploadStats.deadlineDate, 'yyyy-MM-DD', 'DD MMMM yyyy'),
      daysRemaining: uploadStats.daysRemaining,
      notUploaded: uploadStats.notUploadedCount,
      uploaded: uploadStats.uploadedCount,
      localAuthorities: buildLocalAuthoritiesTable(localAuthorityStatus.localAuthorityStatuses),
      bannerMessage,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postLocalAuthorityFilter = (app) => (req, res) => {
    const { status }  = req.query;
    const localAuthorityCode = req.session.localAuthorities.find(la => la.localAuthorityName === req.body.localAuthorityFilter)?.localAuthorityCode;
    return res.redirect(
      app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityCode)
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

    if (localAuthorities && localAuthorities.length) {
      localAuthorities.forEach(function(localAuthority) {
        table.rows.push([
          {
            html: '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items" >'
              + `<input type="checkbox" class="govuk-checkboxes__input select-check authority-select-check" id="select-${localAuthority.id}" name="selectedAuthorities" value="${localAuthority.id}">`
              + `<label class="govuk-label govuk-checkboxes__label" for="select-${localAuthority.id}">`
              + `<span class="govuk-visually-hidden">Select ${localAuthority.id}</span>`
              + '</label>'
              + '</div>',
            classes: 'jd-middle-align'
          },
          {
            // TODO: Add link to authority details page
            html: `<a class='govuk-body govuk-link' href='#'>${localAuthority.localAuthorityName}</a>`,
            classes: 'jd-middle-align',
          },
          {
            html: `<strong class="govuk-tag ${localAuthority.uploadStatus === 'NOT_UPLOADED' ? 'govuk-tag--grey' : ''}">`
                + `${toSentenceCase(localAuthority.uploadStatus)}`
                + '</strong>',
            classes: 'jd-middle-align',
          },
          {
            text: localAuthority.lastUploadDate ? dateFilter(localAuthority.lastUploadDate, 'yyyy-MM-DD', 'DD MMMM yyyy') : '-',
            classes: 'jd-middle-align',
            attributes: {
              'data-sort-value': localAuthority.lastUploadDate ? dateFilter(localAuthority.lastUploadDate, 'yyyy-MM-DD', 'yyyyMMDD') : ''
            },
          }
        ]);
      });
    }

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
