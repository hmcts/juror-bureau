;(function(){
  'use strict';

  module.exports = function(req) {
    return {
      awaitingInformation: {
        presence: {
          allowEmpty: false,
          message: {
            details: (req.session.hasModAccess)
              ? 'Select whether you’re waiting for information from either the juror, court or translation unit'
              : 'Select who the bureau is waiting for a reply from'
          }
        },
      },
    };
  };
})();
