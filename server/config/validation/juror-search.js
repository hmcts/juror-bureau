;(function(){
    'use strict';
  
    var validate = require('validate.js')
      , moment = require('moment');
  
    const dateRegex = /[^0-9\/]+/;
  
    module.exports.serviceStartDate = function() {
        return {
          serviceStartDate: {
            jurorSearchDate: {},
          },
        };
      };

      module.exports.jurorNumberSearched = function() {
        return {
          jurorNumber: {
            jurorNumberSearched: {},
          },
        };
      };

      validate.validators.jurorSearchDate = function(value) {
        var message = {
          summary: '',
          details: [],
        };
    
        if (value === '') return;
    
        if (/[^\d/]+/g.test(value)) {
          message.summary = 'Service start date must only include numbers';
          message.details.push('Service start date must only include numbers');
    
          return message;
        }
    
        if (!modUtils.resolveDateFormat(value)) {
          message.summary = 'Enter a service start date in the correct format, for example, 31/01/2023';
          message.details.push('Enter a service start date in the correct format, for example, 31/01/2023');
    
          return message;
        }
    
        const serviceStartDate = moment(value, 'YYYY-MM-DD');
    
        if (value !== '' && !serviceStartDate.isValid()) {
          message.summary = 'Enter a valid service start date';
          message.details.push('Enter a valid service start date');
    
          return message;
        }
    
        if (message.summary !== '') {
          return message;
        }
    
        return null;
      };
    
      validate.validators.jurorNumberSearched = function(value) {
        var message = {
          fields: ['jurorNumber'],
          summary: '',
          details: [],
        };
    
        // early return in case for some reason it tries to validate an empty pool number
        if (value === '') return null;
    
        if (isNaN(value)) {
          message.summary = 'Juror number must only contain numbers';
          message.details.push('Juror number must only contain numbers');
        } else if (value.toString().length > 9 || value.toString().length < 3) {
          message.summary = 'Juror number must have between 3 and 9 numbers';
          message.details.push('Juror number must have between 3 and 9 numbers');
        };
    
        if (message.summary !== '') {
          return message;
        }
    
        return null;
      };
      
      })();
      
  