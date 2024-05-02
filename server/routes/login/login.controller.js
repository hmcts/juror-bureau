/* eslint-disable strict */
const _ = require('lodash');
const authComponent = require('../../components/auth');

module.exports.index = function() {
  return function(req, res) {
    // If already logged in, force logout
    if (typeof res.locals.authentication !== 'undefined') {
      authComponent.logout(req, res);
    }

    const tmpErrors = _.clone(req.session.errors);

    delete req.session.errors;

    // Render login page with any errors
    return res.render('sign-in.njk', {
      errors: {
        title: 'Please check the form',
        count: typeof tmpErrors !== 'undefined' ? Object.keys(tmpErrors).length : 0,
        items: tmpErrors,
      },
    });
  };
};
