(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const validator = require('../../../../config/validation/create-users');
  const { usersDAO } = require('../../../../objects/users');
  const { replaceAllObjKeys, makeManualError } = require('../../../../lib/mod-utils');
  const { capitalise } = require('../../../../components/filters');

  module.exports.getEditUser = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;
      delete req.session.editUser;

      try {
        const user = await usersDAO.getUserRecord(app, req, username);

        app.logger.info('Fetched user record', {
          auth: req.session.authentication,
          data: {
            user: user,
          },
        });

        replaceAllObjKeys(user, _.camelCase);

        req.session.editUser = {
          orignalDetails: {
            name : user.name,
            email: user.email,
          },
        };

        return res.render('administration/users/edit-user.njk', {
          user,
          tmpBody,
          changeTypeUrl: app.namedRoutes.build('administration.users.edit.type.get', { username }),
          processUrl: app.namedRoutes.build('administration.users.edit.post', { username }),
          cancelUrl: app.namedRoutes.build('administration.users.details.get', { username }),
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });

      } catch (err) {
        app.logger.crit('Failed to fetch user details: ', {
          auth: req.session.authentication,
          data: {
            username,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postEditUser = function(app) {
    return async function(req, res) {
      const { username } = req.params;

      const validatorResult = validate(req.body, validator.userDetails());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.users.edit.get', { username }));
      }

      const payload = {
        'is_active': req.body.isActive,
        'email': req.body.email,
        'name': req.body.name,
        'approval_limit': req.body.approvalLimit,
      };

      if (req.body.roles) {
        payload.roles = !Array.isArray(req.body.roles)
          ? [req.body.roles]
          : req.body.roles; ;
      }

      try {
        await usersDAO.editUser(app, req, username, payload);

        app.logger.info('Updated user details', {
          auth: req.session.authentication,
          data: {
            username: username,
            data: payload,
          },
        });

        return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
      } catch (err) {
        app.logger.crit('Failed to update user details: ', {
          auth: req.session.authentication,
          data: {
            payload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.statusCode === 422) {
          const bvrCodes = {
            'EMAIL_IN_USE': 'email',
          };

          req.session.errors = makeManualError(bvrCodes[err.error?.code] || 'userDetails', err.error?.message || 'Failed to update user details');
          req.session.formFields = req.body;

          return res.redirect(app.namedRoutes.build('administration.users.edit.get', { username }));
        }

        return res.render('_errors/generic.njk');
      }
    };
  };

  module.exports.postConfirmEditUserType = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const user = _.clone(req.session.editUser.details);
      const editPayload = {
        'is_active': true,
        'email': user.email,
        'name': user.name,
      };

      if (user.roles) {
        editPayload.roles = user.roles;
      }

      try {
        await usersDAO.editUserType(app, req, username, capitalise(user.userType));

        app.logger.info('Edited existing users type', {
          auth: req.session.authentication,
          data: {
            username,
            userType: capitalise(user.userType),
          },
        });
      } catch (err) {
        app.logger.crit('Failed to edit existing users type: ', {
          auth: req.session.authentication,
          data: {
            editPayload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });
      }

      try {
        await usersDAO.editUser(app, req, username, editPayload);

        app.logger.info('Edited existing user', {
          auth: req.session.authentication,
          data: {
            username,
            editPayload,
          },
        });

        req.session.bannerMessage = 'User edited';

        return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
      } catch (err) {
        app.logger.crit('Failed to edit existing user: ', {
          auth: req.session.authentication,
          data: {
            editPayload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

})();
