(function() {
  'use strict';

  const _ = require('lodash');
  const { validate } = require('validate.js');
  const validator = require('../../../../config/validation/create-users');
  const { usersDAO, userRecordDAO } = require('../../../../objects/users');
  const { capitalise } = require('../../../../components/filters');
  const roles = require('../users.controller').roles;

  module.exports.getUserType = function(app) {
    return async function(req, res) {
      const tmpErrors = _.clone(req.session.errors);
      const editingUser = req.url.includes('edit-user');
      let processUrl = app.namedRoutes.build('administration.users.create.type.post');
      let cancelUrl = app.namedRoutes.build('administration.users.get');

      delete req.session.errors;

      if (editingUser) {
        processUrl = app.namedRoutes.build('administration.users.edit.type.get', {
          username: req.params.username,
        });
        cancelUrl = app.namedRoutes.build('administration.users.edit.get', {
          username: req.params.username,
        });
      }

      return res.render('administration/users/create-users/user-type.njk', {
        processUrl,
        cancelUrl,
        editingUser,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postUserType = function(app) {
    return async function(req, res) {
      const validatorResult = validate(req.body, validator.userType());
      let errorUrl = app.namedRoutes.build('administration.users.create.type.get');
      let redirectUrl = app.namedRoutes.build('administration.users.create.details.get', {
        userType: req.body.userType || 'bureau',
      });

      if (req.url.includes('edit-user')) {
        errorUrl = app.namedRoutes.build('administration.users.edit.type.get', {
          username: req.params.username,
        });
        redirectUrl = app.namedRoutes.build('administration.users.edit.type.details.get', {
          username: req.params.username,
          userType: req.body.userType || 'bureau',
        });
      }

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;

        return res.redirect(errorUrl);
      }

      return res.redirect(redirectUrl);
    };
  };

  module.exports.getUserDetails = function(app) {
    return async function(req, res) {
      const { userType } = req.params;
      const editingUser = req.url.includes('edit-user');
      const tmpErrors = _.clone(req.session.errors);
      let tmpBody = {};
      let processUrl = app.namedRoutes.build('administration.users.create.details.post', {
        userType,
      });
      let cancelUrl = app.namedRoutes.build('administration.users.get');
      let backLinkUrl = app.namedRoutes.build('administration.users.create.type.get');

      if (editingUser) {
        const username = req.params.username;
        processUrl = app.namedRoutes.build('administration.users.edit.type.details.post', {
          username,
          userType,
        });
        cancelUrl = app.namedRoutes.build('administration.users.edit.get', {
          username,
        });
        backLinkUrl = app.namedRoutes.build('administration.users.edit.type.get', {
          username,
        });
        if (req.session[`editUser-${username}`] && req.session[`editUser-${username}`].details) {
          tmpBody = _.clone(req.session[`editUser-${username}`].details);
        } else if (req.session[`editUser-${username}`]&& req.session[`editUser-${username}`].orignalDetails) {
          tmpBody = _.clone(req.session[`editUser-${username}`].orignalDetails);
        }
      } else if (req.session.createUser && req.session.createUser.details) {
        tmpBody = _.clone(req.session.createUser.details);
      }

      if (req.session.formFields) {
        tmpBody = _.clone(req.session.formFields);
      }

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('administration/users/create-users/user-details.njk', {
        userType,
        editingUser,
        processUrl,
        cancelUrl,
        backLinkUrl: {
          built: true,
          url: backLinkUrl,
        },
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postUserDetails = function(app) {
    return async function(req, res) {
      const { userType } = req.params;
      const editingUser = req.url.includes('edit-user');
      let errorUrl = app.namedRoutes.build('administration.users.create.details.get', {
        userType,
      });
      let redirectUrl = app.namedRoutes.build('administration.users.create.confirm.get', {
        userType,
      });

      if (editingUser) {
        errorUrl = app.namedRoutes.build('administration.users.edit.type.details.get', {
          userType,
          username: req.params.username,
        });
        redirectUrl = app.namedRoutes.build('administration.users.edit.type.confirm.get', {
          userType,
          username: req.params.username,
        });
      }

      if (req.body.roles) {
        req.body.roles = !Array.isArray(req.body.roles)
          ? [req.body.roles]
          : req.body.roles;
      }

      const validatorResult = validate(req.body, validator.userDetails(res, userType.toUpperCase()));

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(errorUrl);
      }
      if (editingUser) {
        const username = req.params.username;
        req.session[`editUser-${username}`].details = {
          userType: userType,
          name: req.body.name,
          email: req.body.email,
          approvalLimit: req.body.approvalLimit,
        };
        if (req.body.roles) {
          req.session[`editUser-${username}`].details.roles = req.body.roles;
        }
      } else {
        req.session.createUser = {
          details: {
            userType: userType,
            name: req.body.name,
            email: req.body.email,
            approvalLimit: req.body.approvalLimit,
          },
        };
        if (req.body.roles) {
          req.session.createUser.details.roles = req.body.roles;
        }
      }

      return res.redirect(redirectUrl);
    };
  };

  module.exports.getConfirmUserDetails = function(app) {
    return async function(req, res) {
      const { userType } = req.params;
      const editingUser = req.url.includes('edit-user');
      const tmpErrors = _.clone(req.session.errors);
      let user;
      let changeUserTypeUrl = app.namedRoutes.build('administration.users.create.type.get');
      let changeUserDetailsUrl =  app.namedRoutes.build('administration.users.create.details.get', {
        userType,
      });
      let processUrl = app.namedRoutes.build('administration.users.create.confirm.post', {
        userType,
      });
      let cancelUrl =  app.namedRoutes.build('administration.users.get');

      delete req.session.errors;

      if (editingUser) {
        const username = req.params.username;
        user = _.clone(req.session[`editUser-${username}`].details);

        changeUserTypeUrl = app.namedRoutes.build('administration.users.edit.type.get', {
          username,
        });
        changeUserDetailsUrl =  app.namedRoutes.build('administration.users.edit.type.details.get', {
          userType,
          username,
        });
        processUrl = app.namedRoutes.build('administration.users.edit.type.confirm.post', {
          userType,
          username,
        });
        cancelUrl =  app.namedRoutes.build('administration.users.edit.get', {
          username,
        });
      } else {
        user = _.clone(req.session.createUser.details);
      }
      let extraPermissions = [];

      if (user.roles) {
        extraPermissions = user.roles.map((role) => roles[role].title);
      }

      return res.render('administration/users/create-users/confirm-details.njk', {
        user,
        extraPermissions,
        editingUser,
        changeUserTypeUrl,
        changeUserDetailsUrl,
        processUrl,
        cancelUrl,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postConfirmUserDetails = function(app) {
    return async function(req, res) {
      const { userType } = req.params;
      const user = _.clone(req.session.createUser.details);
      const payload = {
        'user_type': capitalise(user.userType),
        email: user.email,
        name: user.name,
        'approval_limit': user.userType.toUpperCase() === 'COURT' ? user.approvalLimit : null,
      };

      if (user.roles) {
        payload.roles = user.roles;
      }

      try {
        const data = await userRecordDAO.post(req, payload);
        const username = data.username;

        app.logger.info('Created new user', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            username,
            payload,
          },
        });

        req.session.bannerMessage = 'New user created';

        return res.redirect(app.namedRoutes.build('administration.users.details.get', { username }));
      } catch (err) {
        app.logger.crit('Failed to create new user: ', {
          auth: req.session.authentication,
          jwt: req.session.authToken,
          data: {
            payload,
          },
          error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
        });

        if (err.error.code === 'EMAIL_IN_USE') {

          req.session.errors = {
            email: [
              {
                summary: 'Email address already in use',
                details: 'Email address already in use',
              },
            ],
          };

          return res.redirect(app.namedRoutes.build('administration.users.create.confirm.get', {
            userType: req.params.userType,
          }));
        }

        return res.render('_errors/generic', { err });
      }
    };
  };


})();
