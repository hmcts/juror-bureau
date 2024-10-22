(function() {
  'use strict';
  const _ = require('lodash');
  const { validate } = require('validate.js');
  const { courtDetailsDAO, courtroomsDAO } = require('../../../objects/administration');
  const { convert24to12, convert12to24 } = require('../../../components/filters');
  const { replaceAllObjKeys, padTimeForApi } = require('../../../lib/mod-utils');
  const validator = require('../../../config/validation/court-details');
  const { isSystemAdministrator } = require('../../../components/auth/user-type');

  module.exports.getCourtDetails = function(app) {
    return (req, res) => {
      const { locationCode } = req.params;
      const tmpBody = _.clone(req.session.formFields);
      const tmpErrors = _.clone(req.session.errors);

      delete req.session.formFields;
      delete req.session.errors;

      Promise.all([
        courtDetailsDAO.get(app, req, locationCode),
        courtroomsDAO.get(req, locationCode),
      ])
        .then(([{ response: courtDetails, headers }, courtrooms]) => {

          req.session[`courtDetails-${locationCode}`] = {
            etag: headers.etag,
          };

          replaceAllObjKeys(courtDetails, _.camelCase);
          replaceAllObjKeys(courtrooms, _.camelCase);

          const originalCourtRoomId = courtrooms.find(c => c.roomName === courtDetails.assemblyRoom)
            ? courtrooms.find(c => c.roomName === courtDetails.assemblyRoom).id
            : '';
          const attendanceTime = extractTimeString(convert24to12(courtDetails.attendanceTime));

          return res.render('administration/court-details.njk', {
            originalCourtRoomId,
            attendanceTime,
            cancelUrl: isSystemAdministrator(req, res)
              ? app.namedRoutes.build('administration.courts-and-bureau.get')
              : app.namedRoutes.build('administration.court-details.get', {
                locationCode,
              }),
            courtDetails,
            courtrooms,
            postUrl: app.namedRoutes.build('administration.court-details.post', {
              locationCode,
            }),
            tmpBody,
            errors: {
              title: 'Please check the form',
              count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
              items: tmpErrors,
            },
          });
        })
        .catch((err) => {
          app.logger.crit('Failed to fetch court details', {
            auth: req.session.authentication,
            token: req.session.authToken,
            data: {
              locCode: req.params.locationCode,
            },
            error: typeof err.error !== 'undefined' ? err.error : err.toString(),
          });

          return res.render('_errors/generic.njk');
        });
    };
  };

  module.exports.postCourtDetails = function(app) {
    return async(req, res) => {
      const { locationCode } = req.params;
      const redirectUrl = app.namedRoutes.build('administration.court-details.get', {
        locationCode,
      });

      const validatorResult = validate(req.body, validator.courtDetails());

      if (typeof validatorResult !== 'undefined') {
        req.session.errors = validatorResult;
        req.session.formFields = req.body;
        return res.redirect(redirectUrl);
      }

      try {
        await courtDetailsDAO.get(app, req, locationCode, req.session[`courtDetails-${locationCode}`].etag);

        req.session.errors = {
          bankDetails: [{
            summary: 'Court location details have been updated by another user',
            details: 'Court location details have been updated by another user',
          }],
        };

        return res.redirect(redirectUrl);
      } catch (err) {
        if (err.statusCode !== 304) {

          app.logger.crit('Failed to compare etags for when updating court location details: ', {
            auth: req.session.authentication,
            jwt: req.session.authToken,
            data: {
              locationCode,
            },
            error: (typeof err.error !== 'undefined') ? err.error : err.toString(),
          });

          return res.render('_errors/generic');
        }
      }

      delete req.body._csrf;

      const payload = _.clone(req.body);

      payload.defaultAttendanceTime = padTimeForApi(
        convert12to24(
          `${req.body.defaultAttendanceTimeHour}
          :${req.body.defaultAttendanceTimeMinute}
          ${req.body.defaultAttendanceTimePeriod}`
        )
      );

      delete payload.defaultAttendanceTimeHour;
      delete payload.defaultAttendanceTimeMinute;
      delete payload.defaultAttendanceTimePeriod;

      replaceAllObjKeys(payload, _.snakeCase);

      try {
        await courtDetailsDAO.put(app, req, locationCode, payload);
        res.redirect(redirectUrl);
      } catch (err) {
        app.logger.crit('Failed to update court details', {
          auth: req.session.authentication,
          token: req.session.authToken,
          data: {
            locationCode,
            payload,
          },
          error: typeof err.error !== 'undefined' ? err.error : err.toString(),
        });

        return res.render('_errors/generic.njk');
      }
    };
  };

  function extractTimeString(timeString) {
    const timeObj = {
      hour: timeString.match(/\d+/g)[0],
      minute: timeString.match(/\d+/g)[1],
      period: timeString.match(/(am|pm)/g)[0],
    };

    return timeObj;
  }

})();
