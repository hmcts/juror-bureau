/* eslint-disable strict */

const controller = require('./authentication.controller');
const { isSystemAdministrator } = require('../../components/auth/user-type');

module.exports = function(app) {

  app.get('/auth/courts-list',
    'authentication.courts-list.get',
    controller.getCourtsList(app),
  );

  app.post('/auth/courts-list',
    'authentication.courts-list.post',
    controller.postCourtsList(app),
  );

  // this would be used to auth as an admin from the admin page
  app.get('/auth/court/:locCode',
    'authentication.select-court.get',
    isSystemAdministrator,
    controller.getSelectCourt(app),
  );

  // dev email auth
  app.post('/auth/dev/email',
    'authentication.email.dev',
    isDevelopment,
    controller.postDevEmailAuth(app),
  );

  // allow dev auth only in development
  function isDevelopment(_, res, next) {
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) return next();

    return res.status(401).send();
  }

};
