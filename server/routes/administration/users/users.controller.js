(function() {
  'use strict';

  const _ = require('lodash');
  const { usersDAO, userRecordDAO } = require('../../../objects/users');
  const modUtils = require('../../../lib/mod-utils');
  const {
    replaceAllObjKeys,
    transformCourtNames,
    matchUserCourt,
    transformCourtName,
    mapAdminToPoolRequestCourts,
  } = require('../../../lib/mod-utils');
  const { capitalizeFully, dateFilter } = require('../../../components/filters');
  const {
    isBureauManager,
    isCourtManager,
    isSystemAdministrator,
    isManager,
  } = require('../../../components/auth/user-type');
  const { courtsDAO } = require('../../../objects/administration');
  const roles = {
    'MANAGER': {
      'title': 'Manager',
    },
    'SENIOR_JUROR_OFFICER': {
      'title': 'Senior Jury Officer',
    },
    'TEAM_LEADER': {
      'title': 'Team Leader',
    },
  };

  module.exports.roles = roles;

  module.exports.getUsers = function(app) {
    return async function(req, res) {
      const isActive = req.query['isActive'] || 'active'
        , currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || 'name'
        , sortOrder = req.query['sortOrder'] || 'ascending';
      let courtsToDisplay;

      delete req.query['isActive'];
      delete req.session.createUser;

      try {
        const courtsData = await courtsDAO.get(req);

        app.logger.info('Fetched list of courts', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
        });

        const courts = mapAdminToPoolRequestCourts(courtsData);

        const mainCourts = courts.filter((c) => c.courtType === 'MAIN');

        req.session.adminCourts = mainCourts;

        courtsToDisplay = transformCourtNames(mainCourts);

      } catch (err) {
        app.logger.crit('Failed to fetch list of courts: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }

      try {
        let pagination;
        const payload = {
          'only_active': isActive === 'active',
          'sort_field': _.snakeCase(sortBy).toUpperCase(),
          'sort_method': sortOrder === 'ascending' ? 'ASC' : 'DESC',
          'page_number': currentPage,
          'page_limit': modUtils.constants.PAGE_SIZE,
        };
        let sortUrlPrefix = `?isActive=${isActive}`;

        delete req.session.adminUserSearch;

        const searchOpts = {};

        if (req.query.userName) {
          payload['user_name'] = req.query.userName;
          searchOpts['userName'] = req.query.userName;
          sortUrlPrefix = `${sortUrlPrefix}&userName=${req.query.userName}`;
        };
        if (req.query.court) {
          payload['court'] = req.query.court;
          sortUrlPrefix = `${sortUrlPrefix}&court=${req.query.court}`;
          const courtObj = req.session.adminCourts.find((c) => c.locationCode === req.query.court);

          searchOpts['court'] = transformCourtName(courtObj);
        };
        if (req.query.userType) {
          payload['user_type'] = req.query.userType;
          searchOpts['userType'] = req.query.userType;
          sortUrlPrefix = `${sortUrlPrefix}&userType=${req.query.userType}`;
        };

        const users = await usersDAO.post(req, payload);

        replaceAllObjKeys(users, _.camelCase);

        app.logger.info('Fetched list of users', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            users: users,
          },
        });

        const queryTotal = users.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }
        let queryString = '';

        if (!_.isEmpty(req.query)) {
          queryString = '&' + new URLSearchParams(req.query).toString();
        }

        return res.render('administration/users/users.njk', {
          createUserUrl: app.namedRoutes.build('administration.users.create.type.get'),
          searchUrl: app.namedRoutes.build('administration.users.search.post') + `?isActive=${isActive}${queryString}`,
          radioUrls: {
            activeUrl: app.namedRoutes.build('administration.users.get') + `?isActive=active${queryString}`,
            allUrl: app.namedRoutes.build('administration.users.get') + `?isActive=all${queryString}`,
          },
          sortUrlPrefix,
          isActive,
          searchOpts,
          users: transformUsersTable(app, users.data, sortBy, sortOrder)(req, res),
          pagination,
          courtsToDisplay,
        });
      } catch (err) {
        app.logger.crit('Failed to list of users: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postSearchUsers = function(app) {
    return async function(req, res) {
      const builUrl = function(body) {
        let queryString = '';

        if (body.userName) {
          req.query['userName'] = body.userName;
        }
        if (body.locationCode) {
          req.query['court'] = body.locationCode;
        }
        if (body.userType) {
          req.query['userType'] = body.userType;
        }

        if (!_.isEmpty(req.query)) {
          queryString = '?' + new URLSearchParams(req.query).toString();
        }
        return app.namedRoutes.build('administration.users.get') + queryString;
      };

      delete req.query.userName;
      delete req.query.court;
      delete req.query.userType;

      matchUserCourt(req.session.adminCourts, {courtNameOrLocation: req.body.courtSearch})
        .then(function(court) {
          return res.redirect(builUrl({
            userName: req.body.userNameSearch,
            locationCode: court.locationCode,
            userType: req.body.userTypeSearch,
          }));
        })
        .catch(function() {
          return res.redirect(builUrl({
            userName: req.body.userNameSearch,
            userType: req.body.userTypeSearch,
          }));
        });
    };
  };

  module.exports.getCourtBureauUsers = function(app) {
    return async function(req, res) {
      const isActive = req.query['isActive'] || 'active'
        , currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || 'name'
        , sortOrder = req.query['sortOrder'] || 'ascending';
      const radioUrl =  app.namedRoutes.build('administration.court-bureau.users.get', {
        location: isCourtManager(req, res) ? 'court' : 'bureau',
      });

      delete req.query['isActive'];

      try {
        let pagination;
        const payload = {
          'only_active': isActive === 'active',
          'sort_field': _.snakeCase(sortBy).toUpperCase(),
          'sort_method': sortOrder === 'ascending' ? 'ASC' : 'DESC',
          'page_number': currentPage,
          'page_limit': modUtils.constants.PAGE_SIZE,
        };

        const users = await usersDAO.post(req, payload);

        replaceAllObjKeys(users, _.camelCase);

        app.logger.info('Fetched list of users', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            users: users,
          },
        });

        const queryTotal = users.totalItems;

        if (queryTotal > modUtils.constants.PAGE_SIZE) {
          pagination = modUtils.paginationBuilder(queryTotal, currentPage, req.url);
        }

        return res.render('administration/users/court-bureau-users.njk', {
          radioUrls: {
            activeUrl: radioUrl + '?isActive=active',
            allUrl: radioUrl + '?isActive=all',
          },
          isActive,
          users: transformUsersTable(app, users.data, sortBy, sortOrder)(req, res),
          pagination,
        });
      } catch (err) {
        app.logger.crit('Failed to list of users: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.getUserRecord = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      let successBanner;

      if (req.session.bannerMessage) {
        successBanner = req.session.bannerMessage;
        delete req.session.bannerMessage;
      }

      delete req.session[`editUser-${username}`];

      try {
        const user = await userRecordDAO.get(req, username);

        replaceAllObjKeys(user, _.camelCase);

        app.logger.info('Fetched user record', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            user: user,
          },
        });

        return res.render('administration/users/user-record.njk', {
          user,
          successBanner,
          roles,
          editUserUrl: app.namedRoutes.build('administration.users.edit.get', {
            username: user.username,
          }),
          assignCourtsUrl: app.namedRoutes.build('administration.users.assign-courts.get', {
            username: user.username,
          }),
          backLinkUrl: isSystemAdministrator(req, res)
            ? app.namedRoutes.build('administration.users.get')
            : app.namedRoutes.build('administration.court-bureau.users.get', {
              location: isBureauManager(req, res) ? 'bureau' : 'court',
            }),
        });
      } catch (err) {
        app.logger.crit('Failed to fetch user record: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };


  function transformUsersTable(app, users, sortBy, sortOrder) {
    return function(req, res) {
      const table = {
          head: [],
          rows: [],
        }
        , order = sortOrder || 'ascending';

      table.head.push(
        {
          id: 'name',
          value: 'Name',
          sort: sortBy === 'name' ? order : 'none',
        },
        {
          id: 'email',
          value: 'Email',
          sort: sortBy === 'email' ? order : 'none',
        },
      );

      if (isSystemAdministrator(req, res)) {
        table.head.push(
          {
            id: 'userType',
            value: 'User type',
            sort: sortBy === 'userType' ? order : 'none',
          },
          {
            id: 'court',
            value: 'Main courts',
            sort: sortBy === 'court' ? order : 'none',
          },
        );
      }

      if (isManager(req, res)) {
        table.head.push(
          {
            id: 'manager',
            value: 'Manager',
            sort: sortBy === 'manager' ? order : 'none',
          },
        );
        if (isCourtManager(req, res)) {
          table.head.push(
            {
              id: 'seniorJurorOfficer',
              value: 'SJO',
              sort: sortBy === 'seniorJurorOfficer' ? order : 'none',
            },
          );
        }
      }

      table.head.push(
        {
          id: 'lastSignedIn',
          value: 'Last sign in',
          sort: sortBy === 'lastSignedIn' ? order : 'none',
        },
        {
          id: 'active',
          value: 'Status',
          sort: sortBy === 'active' ? order : 'none',
        },
      );

      users.forEach(function(user) {
        const item = [];

        const courts = [];

        user.courts.forEach(function(court) {
          courts.push('<p class="govuk-body govuk-!-margin-bottom-0">'
          + capitalizeFully(`${court.primaryCourt.name} (${court.primaryCourt.locCode})`)
          + '</p>'
          );
        });

        item.push(
          {
            html: `<a href="${app.namedRoutes.build('administration.users.details.get', {username: user.username})}" 
            class="govuk-link">${user.name}</a>`,
          },
          {
            html: `<a href="#" class="govuk-link">${user.email}</a>`,
          },
        );

        if (isSystemAdministrator(req, res)) {
          item.push(
            {
              text: capitalizeFully(user.userType),
            },
            {
              html: courts.length ? courts.join('') : '<p class="govuk-body govuk-!-margin-bottom-0">-</p>',
            },
          );
        }

        if (isManager(req, res)) {
          item.push(
            {
              text: user.roles.includes('MANAGER') ? 'Yes' : 'No',
            },
          );
          if (isCourtManager(req, res)) {
            item.push(
              {
                text: user.roles.includes('SENIOR_JUROR_OFFICER') ? 'Yes' : 'No',
              },
            );
          }
        }

        item.push(
          {
            text: user.lastSignIn ? dateFilter(user.lastSignIn, 'yyyy-MM-dd', 'D MMM YYYY') : '-',
          },
          {
            text: user.isActive ? 'Active' : 'Inactive',
          },
        );

        table.rows.push(item);
      });

      return table;

    };
  };

})();
