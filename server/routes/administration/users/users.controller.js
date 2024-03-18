const { courtsDAO } = require('../../../objects/administration');

(function() {
  'use strict';

  const _ = require('lodash');
  const { usersDAO } = require('../../../objects/users');
  const {
    paginationBuilder,
    constants,
    replaceAllObjKeys,
    transformCourtNames,
    matchUserCourt,
    transformCourtName,
    mapAdminToPoolRequestCourts,
  } = require('../../../lib/mod-utils');
  const { capitalizeFully } = require('../../../components/filters');

  module.exports.getUsers = function(app) {
    return async function(req, res) {
      const isActive = req.query['isActive'] || 'active'
        , currentPage = req.query['page'] || 1
        , sortBy = req.query['sortBy'] || 'name'
        , sortOrder = req.query['sortOrder'] || 'ascending';
      let courtsToDisplay;

      delete req.query['isActive'];
      delete req.session.createUser;
      delete req.session.editUser;

      try {
        const courtsData = await courtsDAO.get(app, req);

        app.logger.info('Fetched list of courts', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            courtsData,
          },
        });

        const courts = mapAdminToPoolRequestCourts(courtsData);

        const mainCourts = courts.filter((c) => c.courtType === 'MAIN');

        req.session.adminCourts = mainCourts;
        // console.log(mainCourts);

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
          'page_limit': constants.PAGE_SIZE,
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

        const users = await usersDAO.getUsers(app, req, payload);

        replaceAllObjKeys(users, _.camelCase);

        app.logger.info('Fetched list of users', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            users: users,
          },
        });

        const queryTotal = users.totalItems;

        if (queryTotal > constants.PAGE_SIZE) {
          pagination = paginationBuilder(queryTotal, currentPage, req.url);
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
          users: transformUsersTable(app, users.data, sortBy, sortOrder),
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

      console.log('here');

      matchUserCourt(req.session.adminCourts, {courtNameOrLocation: req.body.courtSearch})
        .then(function(court) {
          console.log(court);
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

  module.exports.getUserRecord = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      let successBanner;

      if (req.session.bannerMessage) {
        successBanner = req.session.bannerMessage;
        delete req.session.bannerMessage;
      }

      delete req.session.editUser;

      try {
        const user = await usersDAO.getUserRecord(app, req, username);

        replaceAllObjKeys(user, _.camelCase);

        return res.render('administration/users/user-record.njk', {
          user,
          successBanner,
          editUserUrl: app.namedRoutes.build('administration.users.edit.get', {
            username: user.username,
          }),
          assignCourtsUrl: app.namedRoutes.build('administration.users.assign-courts.get', {
            username: user.username,
          }),
          backLinkUrl: {
            built: true,
            url: app.namedRoutes.build('administration.users.get'),
          },
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
      {
        id: 'lastSignIn',
        value: 'Last sign in',
        sort: sortBy === 'lastSignIn' ? order : 'none',
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
          attributes: {
            'data-sort-value': user.name,
          },
        },
        {
          html: `<a href="#" class="govuk-link">${user.email}</a>`,
          attributes: {
            'data-sort-value': user.email,
          },
        },
        {
          text: capitalizeFully(user.userType),
          attributes: {
            'data-sort-value': user.userType,
          },
        },
        {
          html: courts.length ? courts.join('') : '<p class="govuk-body govuk-!-margin-bottom-0">-</p>',
          attributes: {
            'data-sort-value': courts.length ? courts : '-',
          },
        },
        {
          text: user.lastSignIn || '-',
          attributes: {
            'data-sort-value': user.lastSignIn || '-',
          },
        },
        {
          text: user.isActive ? 'Active' : 'Inactive',
          attributes: {
            'data-sort-value': user.isActive,
          },
        },
      );

      table.rows.push(item);
    });

    return table;
  };

})();
