;(function(){
  'use strict';
  var emailRegex =  /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$|/i;

  require('./custom-validation');

  module.exports = function() {
    return {
      thirdPartyFirstName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the third party first name',
            details: 'Please enter the third party first name',
          },
        },
        length: {
          maximum: 50,
          message: {
            summary: 'Please check the third party first name',
            details: 'Please check the third party first name',
          },
        },
      },

      thirdPartyLastName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the third party last name',
            details: 'Please enter the third party last name',
          },
        },
        length: {
          maximum: 50,
          message: {
            summary: 'Please check the third party last name',
            details: 'Please check the third party last name',
          },
        },
      },

      relationship: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please check the third party relationship to person summoned',
            details: 'Please enter the third party relationship to person summoned',
          },
        },
        length: {
          maximum: 100,
          message: {
            summary: 'Please check the third party relationship to person summoned',
            details: 'Please check the third party relationship to person summoned',
          }
        },
      },

      thirdPartyMainPhone: {
        presenceThirdPartyMainPhone: {
          useJurorPhoneDetails: 'useJurorPhoneDetails',
          thirdPartyEmail: 'thirdPartyEmail',
          message: {
            summary: 'Please enter the third party main phone number',
            details: 'Please enter the third party main phone number',
          },
        },
        format: {
          pattern: '^[0-9 +]{8,15}|$',
          message: {
            summary: 'Please check the third party main phone number',
            details: 'Please check the third party main phone number',
          },
        },
      },

      thirdPartyAltPhone: {
        format: {
          pattern: '^[0-9 +]{8,15}|$',
          message: {
            summary: 'Please check the third party optional phone number',
            details: 'Please check the third party optional phone number',
          },
        },
      },

      thirdPartyEmail: {
        presenceThirdPartyEmail: {
          useJurorEmailDetails: 'useJurorEmailDetails',
          thirdPartyMainPhone: 'thirdPartyMainPhone',
          message: {
            summary: 'Please enter the third party email address',
            details: 'Please enter the third party email address',
          },
        },
        format: {
          pattern: emailRegex,
          message: {
            summary: 'Please check the email address',
            details: 'Please check the email address',
          }
        },
      },

      thirdPartyEmailConfirmation: {
        equality: {
          attribute: 'thirdPartyEmail',
          message: {
            summary: 'Please check the third party email address',
            details: 'The third party email address you entered doesn\'t match the email address in the box above.'
          },
        },
      },

      thirdPartyReason: {
        presence: {
          allowEmpty: false,
          message: 'Please tell us why the third party is replying for the person named on the jury summons',
        },
      },

      thirdPartyOtherReason: {
        presenceIf: {
          field: 'thirdPartyReason',
          value: 'other',
          message: {
            summary: 'Please provide details',
            details: 'Please provide details',
          },
        },
      },
    };
  };
})();
