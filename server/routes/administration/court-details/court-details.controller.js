(() => {
  'use strict';

  const { courtDetailsDAO, courtroomsDAO } = require('../../../objects/administration');
  const { convert24to12 } = require('../../../components/filters');

  const getCourtDetails = function(app) {
    return (req, res) => {
      return res.redirect(app.namedRoutes.build('administration.court-details.location.get', {
        locationCode: req.session.authentication.owner,
      }));
    };
  };

  const getCourtLocationDetails = function(app) {
    return (req, res) => {
      Promise.all([
        courtDetailsDAO.get(app, req, req.params.locationCode),
        courtroomsDAO.get(app, req, req.params.locationCode),
      ]).then(
        ([courtDetails, courtrooms]) => {
          console.log(courtDetails);
          console.log(courtrooms);
          req.session.courtrooms = courtrooms;

          const attendanceTime = extractTimeString(convert24to12(courtDetails.attendance_time));

          return res.render('administration/court-details.njk', {
            attendanceTime,
            cancelUrl: app.namedRoutes.build('administration.court-details.location.get', {
              locationCode: req.params.locationCode,
            }),
            courtDetails,
            courtrooms,
            postUrl: app.namedRoutes.build('administration.court-details.location.post', {
              locationCode: req.params.locationCode,
            }),
          });
        }, err => {
          console.error(err);
        });
    };
  };

  const postCourtLocationDetails = function(app) {
    return (req, res) => {
      console.log(req.body);
      const detailsUrl = app.namedRoutes.build('administration.court-details.location.get', {
        locationCode: req.params.locationCode,
      });
      // validate, and then:

      courtDetailsDAO.post(app, req, req.params.locationCode, req.body).then(
        (data) => {
          res.redirect(detailsUrl);
        },
        (err) => {
          console.error(err);
        }
      );
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

  module.exports = {
    getCourtDetails,
    getCourtLocationDetails,
    postCourtLocationDetails,
  };
})();
