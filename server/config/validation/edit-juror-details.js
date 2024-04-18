;(function(){
  'use strict';
    var emailRegex =  /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$|/i;

  require('./custom-validation');

  const { constants } = require('../../lib/mod-utils');

  module.exports = function(req) {
    return {
      title: {
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the title',
            details: 'Please check the title',
          },
        },
        length: {
          maximum: 10,
          message: {
            summary: 'Please check the title',
            details: 'Please check the title',
          },
        },
      },
      firstName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the first name',
            details: 'Please provide the first name',
          }
        },
        length: {
          maximum: 20,
          message: {
            summary: 'Please check the first name',
            details: 'Please check the first name',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the first name',
            details: 'Please check the first name',
          }
        }
      },
      lastName: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the last name',
            details: 'Please provide the last name',
          }
        },
        length: {
          maximum: 20,
          message: {
            summary: 'Please check the last name',
            details: 'Please check the last name',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the last name',
            details: 'Please check the last name',
          }
        },
      },

      address1: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the first line of the address',
            details: 'Please provide the first line of the address',
          }
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the address',
            details: 'Please check the first line of the address',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the address',
            details: 'Please check the first line of the address',
          },
        }
      },
      address2: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the second line of the address',
            details: 'Please check the second line of the address',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the second line of the address',
            details: 'Please check the second line of the address',
          },
        }
      },
      address3: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the third line of the address',
            details: 'Please check the third line of the address',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the third line of the address',
            details: 'Please check the third line of the address',
          },
        }
      },
      address4: {
        presenceIfNot: {
          field: 'thirdPartyReason',
          value: 'deceased',
          message: {
            summary: 'Please provide the Town or City',
            details: 'Please provide the Town or City',
          }
        },
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the Town or City',
            details: 'Please check the Town or City',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the Town or City',
            details: 'Please check the Town or City',
          },
        }
      },
      address5: {
        length: {
          maximum: 35,
          message: {
            summary: 'Please check the county',
            details: 'Please check the county',
          }
        },
        format: {
          pattern: '^$|^[^|"]+$',
          message: {
            summary: 'Please check the county',
            details: 'Please check the county',
          },
        }
      },
      postcode: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Please provide the postcode',
            details: 'Please provide the postcode',
          }
        },
        format: {
          pattern: constants.POSTCODE_REGEX,
          message: {
            summary: 'Please check the postcode',
            details: 'Please check the postcode',
          }
        },
        length: {
          maximum: 8,
          message: {
            summary: 'Please check the postcode',
            details: 'Please check the postcode',
          }
        },
      },

      dateOfBirth: {
        dateOfBirth: req
      },

      mainPhone: {
        presenceMainPhone: {
          useJurorPhoneDetails: 'useJurorPhoneDetails',
          jurorEmail: 'emailAddress',
          message: {
            summary: 'Please enter the main phone number',
            details: 'Please enter the main phone number',
          },
        },
        format: {
          pattern: '^([0-9 +]{8,15}|)$',
          message: {
            summary: 'Please check the main phone',
            details: 'Please check the main phone',
          }
        },
      },

      altPhone: {
        format: {
          pattern: '^([0-9 +]{8,15}|)$',
          message: {
            summary: 'Please check the other phone number',
            details: 'Please check the other phone number',

          },
        },
      },

      emailAddress: {
        presenceEmail: {
          useJurorEmailDetails: 'useJurorEmailDetails',
          jurorMainPhone: 'mainPhone',
          message: {
            summary: 'Please enter the email address',
            details: 'Please enter the email address',
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

      emailAddressConfirmation: {
        equality: {
          attribute: 'emailAddress',
          message: {
            summary: 'The email address you entered doesn\'t match the email address in the box above.',
            details: 'The email address you entered doesn\'t match the email address in the box above.'
          },
        },
        length: {
          maximum: 254,
          message: {
            summary: 'Please check the email address',
            details: 'Please check the email address'
          }
        },
      }
    }
  }
})();
