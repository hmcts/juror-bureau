(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const validator = require('../../../../config/validation/assign-courts');
  const { usersDAO } = require('../../../../objects/users');
  const { courtsDAO } = require('../../../../objects/administration');
  const { replaceAllObjKeys } = require('../../../../lib/mod-utils');

  module.exports.getAssignCourts = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      let courts = [];
      let { filter } = req.query;

      delete req.session.errors;

      let assignedPrimaryCourts = [];

      try {
        const { courts } = await usersDAO.getUserRecord(app, req, username);

        assignedPrimaryCourts = courts;
      } catch (err) {
        app.logger.crit('Failed to fetch list of courts: ', {
          auth: req.session.authentication,
          data: { username },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }

      try {
        const courtsData = await courtsDAO.get(app, req);

        app.logger.info('Fetched list of courts', {
          auth: req.session.authentication,
        });

        replaceAllObjKeys(courtsData, _.camelCase);

        courts = courtsData
          .filter((c) => c.courtType === 'MAIN')
          .filter((c) => !assignedPrimaryCourts.find((pc) => pc.primary_court.loc_code === c.locCode));

          if (filter) {
            courts = courtsData
              .filter((court) => {
                const courtName = ((court.courtName).trim().replace(',', '') + ' (' + court.locCode + ')').toLowerCase();
                return courtName.includes(filter.toLowerCase());
              });
          }

        return res.render('administration/users/assign-courts/assign-courts.njk', {
          courts,
          filter,
          filterUrl: app.namedRoutes.build('administration.users.assign-courts.filter', { username }),
          clearFilterUrl: app.namedRoutes.build('administration.users.assign-courts.clear-filter', { username }),
          processUrl: app.namedRoutes.build('administration.users.assign-courts.post', { username }),
          cancelUrl: app.namedRoutes.build('administration.users.details.get', { username }),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });

      } catch (err) {
        app.logger.crit('Failed to fetch list of courts: ', {
          auth: req.session.authentication,
          data: { username },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postFilterCourts = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      return res.redirect(app.namedRoutes.build('administration.users.assign-courts.get', {
        username,
      }) + '?filter=' + req.body.courtSearch);
    };
  };

  module.exports.getClearFilter = function(app) {
    return async function(req, res) {
      const { username } = req.params;

      return res.redirect(app.namedRoutes.build('administration.users.assign-courts.get', { username }));
    };
  };

  module.exports.postAssignCourts = function(app) {
    return async function(req, res) {
      const { username } = req.params;

      const validatorResult = validate(req.body, validator.assignCourts());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(app.namedRoutes.build('administration.users.assign-courts.post', {
          username,
        }));
      }


      try {

        const payload = !Array.isArray(req.body.selectedCourts) ? [req.body.selectedCourts] : req.body.selectedCourts;

        await usersDAO.assignCourts(app, req, username, payload);

        app.logger.info('Assigned courts to user', {
          auth: req.session.authentication,
          data: {
            username: username,
            courts: payload,
          },
        });

        return res.redirect(app.namedRoutes.build('administration.users.details.get', {
          username,
        }));
      } catch (err) {
        app.logger.crit('Failed to assign courts to user: ', {
          auth: req.session.authentication,
          data: {
            payload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.getRemoveCourt = function(app) {
    return async function(req, res) {
      const { username, locCode } = req.params;

      try {
        const user = await usersDAO.getUserRecord(app, req, username);

        app.logger.info('Fetched user record', {
          auth: req.session.authentication,
          data: {
            user: user,
          },
        });

        replaceAllObjKeys(user, _.camelCase);

        const courts = user.courts.find((c) => c.primaryCourt.locCode === locCode);

        return res.render('administration/users/assign-courts/remove-court.njk', {
          courts,
          processUrl: app.namedRoutes.build('administration.users.remove-court.post', { username }),
          cancelUrl: app.namedRoutes.build('administration.users.details.get', { username }),
        });
      } catch (err) {
        app.logger.crit('Failed to fetch user record details: ', {
          auth: req.session.authentication,
          data: {
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postRemoveCourt = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const payload = req.body.courts.split(',');

      try {
        await usersDAO.removeCourts(app, req, username, payload);
        app.logger.info('Removed courts from user', {
          auth: req.session.authentication,
          data: {
            username: username,
            courts: payload,
          },
        });
        req.session.bannerMessage = `Court${payload.length > 1 ? 's' : ''} removed`;
        return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
      } catch (err) {
        app.logger.crit('Failed to remove courts from user: ', {
          auth: req.session.authentication,
          data: {
            payload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
