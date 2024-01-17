;(function(){
  'use strict';

  // Secret values that should not be source controlled
  // ==================================
  module.exports = {
    // Key used to encrypt the session
    sessionSecret: '[super-secret-key][super-secret-key][super-secret-key]',

    // Key used to encrypt the JWT token
    jwtKey: '[super-secret-key-bureau][super-secret-key-bureau][super-secret-key-bureau]',

    // Key used prior to gaining authentication, for insecure endpoints
    jwtNoAuthKey: '[super-secret-key-login][super-secret-key-login][super-secret-key-login]',

    // Number of seconds the JWT token will live for.
    jwtTTL: 60*60*8,
  };

})();
