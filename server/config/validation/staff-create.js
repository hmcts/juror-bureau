;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the new staff member name',
            details: 'Please provide a name for the new staff member'
          },
        },

        length: {
          maximum: 30,
          message: {
            summary: 'Please check the new staff member name',
            details: 'Please check the name for the new staff member',
          }
        },
      }, // End name

      teamLeader: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the new staff member Team leader status',
            details: 'Please state if the new staff member is a Team leader or not',
          },
        },
      }, // End teamLeader

      /*
      active: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the new staff member active status',
            details: 'Please state if the new staff member is active or not',
          },
        },
      }, // End active
      */

      login: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the new staff member Juror application user name',
            details: 'Please enter the staff member Juror application user name',
          },
        },
      }, // End login

      /*
      team: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the new staff member team',
            details: 'Please select a team for the staff member',
          },
        },
      }, // End team
      */

      /*
      court: {
        courtGroup: {
          fields: req.body.court,
        }
      }, // End court
      */

    };
  };
})();
