(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { isSJOUser, isManager } = require('../../../../components/auth/user-type');
  const validator = require('../../../../config/validation/create-users');
  const { usersDAO, userRecordDAO } = require('../../../../objects/users');
  const { replaceAllObjKeys, makeManualError } = require('../../../../lib/mod-utils');
  const { capitalise } = require('../../../../components/filters');

  module.exports.getEditUser = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;
      delete req.session[`editUser-${username}`];

      if (isSJOUser(req) && !isManager(req)) {
        app.logger.warn('SJO user tried to edit user details', {
          auth: req.session.authentication,
          data: {
            username,
          },
        });

        return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
      }

      try {
        const user = await userRecordDAO.get(req, username);

        if (user.email === req.session.authentication.email) {
          app.logger.warn('User tried to edit their own details', {
            auth: req.session.authentication,
            data: {
              user,
            },
          });

          return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
        }

        app.logger.info('Fetched user record', {
          auth: req.session.authentication,
          data: {
            user: user,
          },
        });

        replaceAllObjKeys(user, _.camelCase);

        req.session[`editUser-${username}`] = {
          orignalDetails: {
            name : user.name,
            email: user.email,
            userType: user.userType,
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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postEditUser = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const { userType } = req.session[`editUser-${username}`].orignalDetails;

      const validatorResult = validate(req.body, validator.userDetails(res, userType.toUpperCase()));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.users.edit.get', { username }));
      }

      const payload = {
        'is_active': req.body.isActive,
        'email': req.body.email,
        'name': req.body.name,
        'approval_limit': userType.toUpperCase() === 'COURT' ? req.body.approvalLimit : null,
      };

      if (req.body.roles) {
        payload.roles = !Array.isArray(req.body.roles)
          ? [req.body.roles]
          : req.body.roles; ;
      }

      try {
        await userRecordDAO.put(req, username, payload);

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

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postConfirmEditUserType = function(app) {
    return async function(req, res) {
      const { username } = req.params;
      const user = _.clone(req.session[`editUser-${username}`].details);
      const editPayload = {
        'is_active': true,
        'email': user.email,
        'name': user.name,
      };

      if (user.roles) {
        editPayload.roles = user.roles;
      }

      try {
        await userRecordDAO.patch(req, username, capitalise(user.userType));

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
        await userRecordDAO.put(req, username, editPayload);

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

        return res.render('_errors/generic', { err });
      }
    };
  };

})();
