(() => {
  'use strict';

  const _ = require('lodash');
  const { dateFilter, toSentenceCase } = require('../../components/filters');
  const { makeManualError, paginationBuilder } = require('../../lib/mod-utils');
  const { erLocalAuthorityStatusDAO, localAuthoritiesDAO, erUploadStats } = require('../../objects/electoral-register');
  const PAGE_SIZE = 20;

  module.exports.getDashboard = app => async (req, res) => {
    const { localAuthorityFilter, status, sortBy, sortOrder } = req.query;

    const tmpErrors = _.clone(req.session.errors);
    const bannerMessage = _.clone(req.session.bannerMessage);

    delete req.session.errors;
    delete req.session.bannerMessage;
    delete req.session.localAuthorities; // Clear local authorities from session to ensure fresh data is fetched
    delete req.session.checkedLaCodes;

    let allLocalAuthorities = [];
    try {
      allLocalAuthorities = (await localAuthoritiesDAO.get(req)).localAuthorities;
      req.session.localAuthorities = allLocalAuthorities; // Store in session for later use if needed
    } catch (err) {
      app.logger.crit('Error fetching all local authorities', {
        auth: req.session.authentication,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });
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
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });
    }

    let localAuthorityStatus = {};
    try {
      const payload = {
        localAuthorityCode: localAuthorityFilter,
        uploadStatus: !status || status === 'all' ? ['UPLOADED', 'NOT_UPLOADED'] : [_.snakeCase(status).toUpperCase()],
      };
      localAuthorityStatus = await erLocalAuthorityStatusDAO.post(req, payload);
      app.logger.info('Fetched electoral register local authority uploads', {
        auth: req.session.authentication,
      });
    } catch (err) {
      app.logger.crit('Error fetching electoral register dashboard data', {
        auth: req.session.authentication,
        error: typeof err.error !== 'undefined' ? err.error : err.toString(),
      });
    }

    if (status === 'all' && localAuthorityFilter && localAuthorityStatus.localAuthorityStatuses.length === 0) {
      app.logger.info('Redirecting to inactive local authority information page', {
        auth: req.session.authentication,
        laCode: localAuthorityFilter,
      });

      return res.redirect(
        app.namedRoutes.build('electoral-register.local-authority.get', {
          laCode: localAuthorityFilter,
        })
      );
    }

    let localAuthorityData = sortLocalAuthorities(sortBy, sortOrder, localAuthorityStatus.localAuthorityStatuses);
    const totalLocalAuthorities = localAuthorityData.length;

    if (!req.session.erDashboardData) {
      req.session.erDashboardData = {
        totalLocalAuthorities,
        allLocalAuthorityCodes: localAuthorityData.map(la => la.localAuthorityCode),
      };
    } else {
      req.session.erDashboardData.totalLocalAuthorities = totalLocalAuthorities;
      req.session.erDashboardData.allLocalAuthorityCodes = localAuthorityData.map(la => la.localAuthorityCode);
    }

    localAuthorityData = paginateLocalAuthorities(localAuthorityData, parseInt(req.query.page) || 1);

    let pagination = {};
    if (totalLocalAuthorities > PAGE_SIZE) {
      pagination = paginationBuilder(totalLocalAuthorities, parseInt(req.query.page) || 1, req.url);
    }

    return res.render('electoral-register/dashboard.njk', {
      postRoutes: {
        filter:
          app.namedRoutes.build('electoral-register.filter.post') +
          buildQueryParams(status, localAuthorityFilter, sortBy, sortOrder),
        sendReminder:
          app.namedRoutes.build('electoral-register.post') +
          buildQueryParams(status, localAuthorityFilter, sortBy, sortOrder, 'send-reminder'),
        markEmailDelivered:
          app.namedRoutes.build('electoral-register.post') +
          buildQueryParams(status, localAuthorityFilter, sortBy, sortOrder, 'mark-email-delivered'),
      },
      actionRoutes: {
        setDeadline: app.namedRoutes.build('electoral-register.set-deadline.get'),
        changeDeadline: app.namedRoutes.build('electoral-register.change-deadline.get'),
        downloadAllEmails: app.namedRoutes.build('electoral-register.download-emails.get', { status: 'all' }),
        downloadActiveEmails: app.namedRoutes.build('electoral-register.download-emails.get', { status: 'active' }),
      },
      showDeadlineWarrning: uploadStats.daysRemaining <= 28,
      deadlinePassed: uploadStats.daysRemaining < 0,
      localAuthorityFilter,
      selectedLocalAuthority,
      status: status || 'all',
      laAutoCompleteNames: allLocalAuthorities.sort((la1, la2) => la1.id - la2.id).map(la => la.localAuthorityName),
      deadline: uploadStats.deadlineDate
        ? dateFilter(uploadStats.deadlineDate, 'yyyy-MM-DD', 'DD MMMM yyyy')
        : 'No deadline set',
      daysRemaining: uploadStats.daysRemaining >= 0 ? uploadStats.daysRemaining : 0,
      notUploaded: uploadStats.notUploadedCount || 0,
      uploaded: uploadStats.uploadedCount || 0,
      localAuthorities: buildLocalAuthoritiesTable(app)(req, localAuthorityData, sortBy, sortOrder),
      checkedLocalAuthorities: req.session.erDashboardData?.checkedLocalAuthorities?.length || 0,
      totalLocalAuthorities: req.session.erDashboardData.totalLocalAuthorities,
      sortUrl: buildQueryParams(status, localAuthorityFilter),
      pagination,
      bannerMessage,
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };

  module.exports.postLocalAuthorityFilter = app => (req, res) => {
    const { status, sortBy, sortOrder } = req.query;
    const localAuthorityCode = req.session.localAuthorities.find(
      la => la.localAuthorityName === req.body.localAuthorityFilter
    )?.localAuthorityCode;

    delete req.session.erDashboardData;

    return res.redirect(
      app.namedRoutes.build('electoral-register.get') + buildQueryParams('all', localAuthorityCode, sortBy, sortOrder)
    );
  };

  module.exports.getFilterUploadStatus = app => async (req, res) => {
    const { localAuthorityFilter, status } = req.query;
    delete req.session.erDashboardData;
    return res.redirect(
      app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityFilter)
    );
  };

  module.exports.postSelectedLocalAuthorities = app => (req, res) => {
    const { action, status, localAuthorityFilter } = req.query;

    if (
      !req.session.erDashboardData?.checkedLocalAuthorities ||
      req.session.erDashboardData?.checkedLocalAuthorities.length === 0
    ) {
      req.session.errors = makeManualError('selectedAuthorities', 'At least one authority must be selected');
      return res.redirect(
        app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityFilter)
      );
    }

    const selectedAuthorities = Array.isArray(req.session.erDashboardData.checkedLocalAuthorities)
      ? req.session.erDashboardData.checkedLocalAuthorities
      : [req.session.erDashboardData.checkedLocalAuthorities];

    delete req.session.erDashboardData;

    req.session.checkedLaCodes = selectedAuthorities; // Store selected local authority codes in session for use in subsequent flows

    switch (action) {
      case 'send-reminder':
        return res.redirect(app.namedRoutes.build('electoral-register.send-reminder.get'));
      case 'mark-email-delivered':
        return res.redirect(app.namedRoutes.build('electoral-register.mark-email-delivered.get'));
      default:
        return res.redirect(
          app.namedRoutes.build('electoral-register.get') + buildQueryParams(status, localAuthorityFilter)
        );
    }
  };

  module.exports.postCheckLocalAuthority = app => (req, res) => {
    const { laCode, action } = req.query;

    if (!req.session.erDashboardData.checkedLocalAuthorities) {
      req.session.erDashboardData.checkedLocalAuthorities = [];
    }

    if (laCode === 'selectAllCheckbox') {
      if (action === 'check') {
        req.session.erDashboardData.checkedLocalAuthorities = req.session.erDashboardData.allLocalAuthorityCodes;
      } else if (action === 'uncheck') {
        delete req.session.erDashboardData.checkedLocalAuthorities;
      }
    } else {
      // If already checked -> uncheck
      if (action === 'uncheck') {
        req.session.erDashboardData.checkedLocalAuthorities =
          req.session.erDashboardData.checkedLocalAuthorities.filter(la => {
            return la !== laCode;
          });
      } else {
        req.session.erDashboardData.checkedLocalAuthorities.push(laCode);
      }
    }

    app.logger.info('Checked or unchecked one or more local authorities: ', {
      auth: req.session.authentication,
      data: {
        laCode,
      },
    });

    const noChecked = req.session.erDashboardData.checkedLocalAuthorities
      ? req.session.erDashboardData.checkedLocalAuthorities.length
      : 0;

    return res.status(200).send(noChecked.toString());
  };

  const sortLocalAuthorities = (sortBy, sortDirection, tableData) => {
    if (sortBy) {
      return tableData.sort((a, b) => {
        let _a;
        let _b;
        if (sortBy === 'lastUploadDate') {
          _a = a[sortBy] ? dateFilter(a[sortBy], null, 'yyyyMMDD') : '-';
          _b = b[sortBy] ? dateFilter(b[sortBy], null, 'yyyyMMDD') : '-';
        } else {
          _a = a[sortBy] ? a[sortBy] : '-';
          _b = b[sortBy] ? b[sortBy] : '-';
        }

        if (sortDirection === 'ascending') {
          return _a.localeCompare(_b);
        }

        return _b.localeCompare(_a);
      });
    }
    return tableData;
  };

  const paginateLocalAuthorities = (authorities, currentPage) => {
    let start = 0;
    let end = authorities.length;

    if (currentPage > 1) {
      start = (currentPage - 1) * PAGE_SIZE;
    }
    if (authorities.length > PAGE_SIZE) {
      end = start + PAGE_SIZE;
    }

    return authorities.slice(start, end);
  };

  const buildLocalAuthoritiesTable = app => (req, localAuthorities, sortBy, sortOrder) => {
    const table = {
      head: [],
      rows: [],
    };

    const allChecked =
      req.session.erDashboardData?.checkedLocalAuthorities &&
      req.session.erDashboardData.checkedLocalAuthorities.length === req.session.erDashboardData.totalLocalAuthorities
        ? 'checked'
        : '';

    table.head = [
      {
        html:
          '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items">' +
          `<input type='checkbox' ${allChecked} class='govuk-checkboxes__input select-check authority-select-check' id='selectAllCheckbox' name='selectAllCheckbox'/>` +
          '<label class="govuk-label govuk-checkboxes__label" for="selectAllCheckbox">' +
          '<span class="govuk-visually-hidden">Select All</span>' +
          '</label>' +
          '</div>',
        classes: 'jd-middle-align',
        sortable: false,
      },
      {
        id: 'localAuthorityName',
        value: 'Authority name',
        classes: 'jd-middle-align',
        sort: sortBy === 'localAuthorityName' ? sortOrder : 'none',
      },
      {
        id: 'uploadStatus',
        value: 'Status',
        classes: 'jd-middle-align',
        sort: sortBy === 'uploadStatus' ? sortOrder : 'none',
      },
      {
        id: 'lastUploadDate',
        value: 'Last data upload',
        classes: 'jd-middle-align',
        sort: sortBy === 'lastUploadDate' ? sortOrder : 'none',
      },
    ];

    if (localAuthorities && localAuthorities.length) {
      localAuthorities.forEach(function (localAuthority) {
        const checked =
          req.session.erDashboardData?.checkedLocalAuthorities &&
          req.session.erDashboardData.checkedLocalAuthorities.includes(localAuthority.localAuthorityCode)
            ? 'checked'
            : '';

        table.rows.push([
          {
            html:
              '<div class="govuk-checkboxes__item govuk-checkboxes--small moj-multi-select__checkbox mod-center-items" >' +
              `<input type='checkbox' ${checked} class='govuk-checkboxes__input select-check authority-select-check' id='select-${localAuthority.localAuthorityCode}' aria-label='select-${localAuthority.localAuthorityCode}' name='selectedAuthorities' value='${localAuthority.id}'>` +
              `<label class='govuk-label govuk-checkboxes__label' for='select-${localAuthority.localAuthorityCode}'>` +
              `<span class='govuk-visually-hidden'>Select ${localAuthority.localAuthorityCode}</span>` +
              '</label>' +
              '</div>',
            classes: 'jd-middle-align',
          },
          {
            // TODO: Add link to authority details page
            html:
              `<a class='govuk-body govuk-link'` +
              ` href='${app.namedRoutes.build('electoral-register.local-authority.get', { laCode: localAuthority.localAuthorityCode })}'>` +
              `${localAuthority.localAuthorityName}` +
              `</a>`,
            classes: 'jd-middle-align',
          },
          {
            html:
              `<strong class='govuk-tag ${localAuthority.uploadStatus === 'NOT_UPLOADED' ? 'govuk-tag--grey' : ''}'>` +
              `${toSentenceCase(localAuthority.uploadStatus)}` +
              '</strong>',
            classes: 'jd-middle-align',
          },
          {
            text: localAuthority.lastUploadDate
              ? dateFilter(localAuthority.lastUploadDate, 'yyyy-MM-DD', 'DD MMMM yyyy')
              : '-',
            classes: 'jd-middle-align',
            attributes: {
              'data-sort-value': localAuthority.lastUploadDate
                ? dateFilter(localAuthority.lastUploadDate, 'yyyy-MM-DD', 'yyyyMMDD')
                : '',
            },
          },
        ]);
      });
    }

    return table;
  };

  const buildQueryParams = (status, localAuthorityFilter, sortBy, sortOrder, action) => {
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
    if (sortBy) {
      queryParams += (queryParams.length ? '&' : '?') + `sortBy=${sortBy}`;
    }
    if (sortOrder) {
      queryParams += (queryParams.length ? '&' : '?') + `sortOrder=${sortOrder}`;
    }
    return queryParams;
  };
})();
