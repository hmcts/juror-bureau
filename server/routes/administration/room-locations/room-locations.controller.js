(function() {
  'use strict';
  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { courtroomsDAO, courtroomDetailsDAO } = require('../../../objects/administration');
  const validator = require('../../../config/validation/create-courtroom');
  const { replaceAllObjKeys } = require('../../../lib/mod-utils');

  module.exports.getRoomLocations = function(app) {
    return async(req, res) => {
      const { locationCode } = req.params;
      let successBanner;

      if (req.session.bannerMessage) {
        successBanner = req.session.bannerMessage;
        delete req.session.bannerMessage;
      }

      try {
        const courtrooms = await courtroomsDAO.get(req, locationCode);

        replaceAllObjKeys(courtrooms, _.camelCase);

        return res.render('administration/room-locations/rooms.njk', {
          locationCode,
          courtrooms,
          successBanner,
          addRoomUrl: app.namedRoutes.build('administration.room-locations.add.get', { locationCode }),
        });
      } catch (err) {
        app.logger.crit('Failed to fetch courtooms', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locCode: locationCode,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }

    };
  };

  module.exports.getEditCourtroom = function(app) {
    return async(req, res) => {
      const { locationCode, id } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      try {
        const { response: courtroom, headers } = await courtroomDetailsDAO.get(req, locationCode, id);

        req.session[`editCourtroom-${locationCode}-${id}`] = {
          etag: headers.etag,
        };

        replaceAllObjKeys(courtroom, _.camelCase);

        return res.render('administration/room-locations/add-edit-room.njk', {
          action: 'edit',
          courtroom,
          processUrl: app.namedRoutes.build('administration.room-locations.edit.post', { locationCode, id }),
          cancelUrl: app.namedRoutes.build('administration.room-locations.get', { locationCode }),
          tmpBody,
          errors: {
            title: 'Please check the form',
            count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
            items: tmpErrors,
          },
        });
      } catch (err) {
        app.logger.crit('Failed to fetch courtroom details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locCode: locationCode,
            id,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.postEditCourtroom = function(app) {
    return async(req, res) => {
      const { locationCode, id } = req.params;
      const validatorResult = validate(req.body, validator.roomDetails());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.room-locations.edit.get', {
          locationCode,
          id,
        }));
      }

      try {
        await courtroomDetailsDAO.get(req, locationCode, id, req.session[`editCourtroom-${locationCode}-${id}`].etag);

        req.session.errors = {
          bankDetails: [{
            summary: 'Room location details have been updated by another user',
            details: 'Room location details have been updated by another user',
          }],
        };

        return res.redirect(app.namedRoutes.build('administration.room-locations.edit.get', {
          locationCode,
          id,
        }));
      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when updating room location details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locationCode,
              id,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic', { err });
        }
      }

      delete req.body._csrf;

      const payload = replaceAllObjKeys(req.body, _.snakeCase);

      try {
        await courtroomsDAO.put(req, locationCode, id, payload);

        req.session.bannerMessage = 'Room location updated';

        return res.redirect(app.namedRoutes.build('administration.room-locations.get', {
          locationCode,
        }));
      } catch (err) {
        app.logger.crit('Failed to update courtroom details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locCode: locationCode,
            id,
            payload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

  module.exports.getAddCourtroom = function(app) {
    return async(req, res) => {
      const { locationCode } = req.params;
      const tmpErrors = _.clone(req.session.errors);
      const tmpBody = _.clone(req.session.formFields);

      delete req.session.errors;
      delete req.session.formFields;

      return res.render('administration/room-locations/add-edit-room.njk', {
        action: 'add',
        processUrl: app.namedRoutes.build('administration.room-locations.add.post', { locationCode }),
        cancelUrl: app.namedRoutes.build('administration.room-locations.get', { locationCode }),
        tmpBody,
        errors: {
          title: 'Please check the form',
          count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
          items: tmpErrors,
        },
      });
    };
  };

  module.exports.postAddCourtroom = function(app) {
    return async(req, res) => {
      const { locationCode } = req.params;
      const validatorResult = validate(req.body, validator.roomDetails());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;

        return res.redirect(app.namedRoutes.build('administration.room-locations.add.get', {
          locationCode,
        }));
      }

      delete req.body._csrf;

      const payload = replaceAllObjKeys(req.body, _.snakeCase);

      try {
        await courtroomsDAO.post(req, locationCode, payload);

        req.session.bannerMessage = 'Room location added';

        return res.redirect(app.namedRoutes.build('administration.room-locations.get', {
          locationCode,
        }));
      } catch (err) {
        app.logger.crit('Failed to add courtroom', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locCode: locationCode,
            payload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic', { err });
      }
    };
  };

})();
