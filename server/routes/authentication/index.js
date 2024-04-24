/* eslint-disable strict */

const controller = require('./authentication.controller');

module.exports = function(app) {

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
