;(function(){
  'use strict';

  require('./custom-validation');

  module.exports = function(req) {
    return {
      name: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the staff member name',
            details: 'Please provide a name for the staff member'
          },
        },

        length: {
          maximum: 30,
          message: {
            summary: 'Please check the staff member name',
            details: 'Please check the name for the staff member',
          }
        },
      }, // End name

      teamLeader: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the staff member Team leader status',
            details: 'Please state if the staff member is a Team leader or not',
          },
        },
      }, // End teamLeader

      active: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the staff member active status',
            details: 'Please state if the staff member is active or not',
          },
        },
      }, // End active

      /*
      team: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the staff member team',
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
