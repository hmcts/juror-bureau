;(function(){
  'use strict';

  const validate = require('validate.js'),
    // eslint-disable-next-line max-len
    emailRegex = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

  validate.validators.commonEmailAddress = function(value, options, key, attributes) {
    let message = {
      summary: '',
      fields: [],
      details: [],
    };

    // If email address is not mandatory
    if (!options.required && value === '') {
      return null;
    }

    if (!emailRegex.test(value)) {
      message.fields.push(key);
      message.summary = options.messageMap[key];
      message.details.push(options.messageMap[key]);
    }

    if (message.details.length > 0) {
      return message;
    }

    return null;
  };
})();
