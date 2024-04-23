

;(function(){
  'use strict';

  const moment = require('moment');
  const validate = require('validate.js');
  const filters = require('../../components/filters');
  const { isTeamLeader } = require('../../components/auth/user-type');

  // Overrides to existing rules
  // ===================================
  validate.extend(validate.validators.datetime, {
    parse: function(value) {
      return +moment.utc(value);
    },
    format: function(value, options) {
      var format = options.dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD hh:mm:ss';

      return moment.utc(value).format(format);
    },
  });


  // Creation of new rules
  // ===================================
  validate.validators.courtGroup = function(value, options) {
    var iCourt = 0
      , tmpCourt
      , repeatList = []
      , formatList = []
      , emptyCount = 0
      , occurrenceCount
      , message = {
        summaries: [],
        details: {},
      }
      , filterFunc = function(filterCourt) {
        return filterCourt === tmpCourt;
      };


    for (iCourt; iCourt < options.fields.length; iCourt += 1) {
      tmpCourt = options.fields[iCourt];

      if (tmpCourt.length === 0) {
        emptyCount += 1;
      }

      // Count number of times appears in array
      occurrenceCount = options.fields.filter(filterFunc).length;

      // Must not be repeated
      if (tmpCourt.length > 0 && occurrenceCount > 1) {
        repeatList.push('court_' + (iCourt + 1));
      }

      // Must be 3 numerical characters
      if (tmpCourt.length > 0 && (isNaN(parseInt(tmpCourt, 10)) || tmpCourt.length !== 3)) {
        formatList.push('court_' + (iCourt + 1));
      }
    }


    // If empty count equals total count, all is good. Courts are optional
    // if no issues found, also all is good
    if (emptyCount === options.fields.length || (repeatList.length === 0 && formatList.length === 0)) {
      return null;
    }




    // If we have repeated entries, add them to output
    if (repeatList.length > 0) {
      repeatList.forEach(function(errorCourt) {
        message.summaries.push({
          field: 'court_' + errorCourt.replace('court_', '') + '_Group',
          message: 'Please check the ' + getCourtNumberIdent(errorCourt) + ' Court code',
        });

        message.details[errorCourt] = 'You have entered the same court code more than once. Please remove the duplicate';
      });
    }

    if (formatList.length > 0) {
      formatList.forEach(function(errorCourt) {
        message.summaries.push({
          field: 'court_' + errorCourt.replace('court_', '') + '_Group',
          message: 'Please check the ' + getCourtNumberIdent(errorCourt) + ' Court code',
        });

        message.details[errorCourt] = 'Court code must be a 3 digit number';
      });
    }

    return message;
  };


  validate.validators.presenceIf = function(value, options, key, attributes) {
    var message;

    // We can't do much if we don't have a linked field
    if (options === false || typeof options.field === 'undefined') {
      return null;
    }

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Return A-Ok if our linked field does not have the value
    // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // If we have reached this point then we have failed validation
    return message;
  };

  validate.validators.presenceIfNot = function(value, options, key, attributes) {
    var message;

    // We can't do much if we don't have a linked field
    if (options === false || typeof options.field === 'undefined') {
      return null;
    }

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // Return error if linked field is any value other than the one specified
    if (attributes[options.field] !== options.value) {
      return message;
    }

    // If we have reached this point then we have passed validation
    return null;
  };

  validate.validators.presenceMainPhone = function(value, options, key, attributes) {
    var message
      , useJurorPhoneDetails = attributes[options.useJurorPhoneDetails]
      , jurorEmail = attributes[options.jurorEmail]
      , thirdPartyEmail = attributes[options.thirdPartyEmail];

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your' + filters.prettify(key);
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // if email or 3rdPartyEmail are empty/undefined, we need a main phone
    if (useJurorPhoneDetails === 'Y' || typeof useJurorPhoneDetails === 'undefined') {
      if (jurorEmail === '' && (thirdPartyEmail === '' || typeof thirdPartyEmail === 'undefined')) {
        return message;
      }
    }

    // If we have reached this point then we have passed validation
    return null;
  };

  validate.validators.presenceEmail = function(value, options, key, attributes) {
    var message
      , useJurorEmailDetails = attributes[options.useJurorEmailDetails]
      , jurorMainPhone = attributes[options.jurorMainPhone]
      , thirdPartyMainPhone = attributes[options.thirdPartyMainPhone];

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // if jurors main phone or 3rdParty main phone aren't empty, we don't need an email address
    if (useJurorEmailDetails === 'Y'  || typeof useJurorEmailDetails === 'undefined') {
      if (jurorMainPhone === '' && (thirdPartyMainPhone === '' || typeof thirdPartyMainPhone === 'undefined')) {
        return message;
      }
    }

    // If we have reached this point then we have passed validation
    return null;
  };

  validate.validators.presenceThirdPartyMainPhone = function(value, options, key, attributes) {
    var message
      , useJurorPhoneDetails = attributes[options.useJurorPhoneDetails]
      , thirdPartyEmail = attributes[options.thirdPartyEmail];

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // if 3rdPartyEmail isn't empty, we don't need a 3rd party main phone
    if (useJurorPhoneDetails === 'N') {
      if (thirdPartyEmail !== '') {
        return null;
      }
    } else {
      // we are not using 3rd party phone details
      return null;
    }

    // If we have reached this point then we have failed validation
    return message;
  };

  validate.validators.presenceThirdPartyEmail = function(value, options, key, attributes) {
    var message
      , useJurorEmailDetails = attributes[options.useJurorEmailDetails]
      , thirdPartyMainPhone = attributes[options.thirdPartyMainPhone];

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // if 3rdPartyMainPhone isn't empty, we don't need a 3rd party email
    if (useJurorEmailDetails === 'N') {
      if (thirdPartyMainPhone !== '') {
        return null;
      }
    } else {
      // we are not using jurors email details
      return null;
    }

    // If we have reached this point then we have failed validation
    return message;
  };

  validate.validators.formatIf = function(value, options, key, attributes) {
    var message
      , pattern = new RegExp(options.pattern, options.flags)
      , match = pattern.test(value);

    // We can't do much if we don't have a linked field
    // Also don't care for empty strings
    if (options === false || typeof options.field === 'undefined' || typeof value === 'undefined' || value.length === 0) {
      return null;
    }

    // Return A-Ok if our linked field does not have the value
    // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    if (match) {
      return null;
    }

    return message;
  };


  validate.validators.dateOfBirth = function(value, req, key, attributes) {
    var message = {
        summary: 'Please check the person\'s date of birth',
        fields: [],
        details: [],
      }
      , formattedDob;

    if (attributes.thirdPartyReason === 'deceased') {
      // date of birth fields can be empty
      return null;
    }

    if (typeof attributes.dobDay === 'undefined' || attributes.dobDay.length === 0) {
      message.fields.push('dobDay');
      message.details.push('Please enter the day the person was born');
    } else if ((attributes.dobDay > 31 || attributes.dobDay < 1) || isNaN(parseInt(attributes.dobDay, 10)) || attributes.dobDay.length > 2) {
      message.fields.push('dobDay');
      message.details.push('Please enter the day the person was born as a date. For example, 06');
    }

    if (typeof attributes.dobMonth === 'undefined' || attributes.dobMonth.length === 0) {
      message.fields.push('dobMonth');
      message.details.push('Please enter the month the person was born');
    } else if ((attributes.dobMonth > 12 || attributes.dobMonth < 1) || isNaN(parseInt(attributes.dobMonth, 10)) || attributes.dobMonth.length > 2) {
      message.fields.push('dobMonth');
      message.details.push('Please enter the month the person was born as a number. For example, for December, enter 12');
    }

    if (typeof attributes.dobYear === 'undefined' || attributes.dobYear.length === 0) {
      message.fields.push('dobYear');
      message.details.push('Please enter the year the person was born');
    } else if (attributes.dobYear.length !== 4 || isNaN(parseInt(attributes.dobYear, 10))) {
      message.fields.push('dobYear');
      message.details.push('Please enter the year the person was born as a four digit number. For example, 1982');
    }

    // Check for limits
    formattedDob = moment([attributes.dobYear, attributes.dobMonth, attributes.dobDay].filter(function(val) {
      return val;
    }).join('-'), 'YYYY-MM-DD');

    if (moment().diff(formattedDob, 'days') <= 0) {
      message.fields.push('dateOfBirth');
      message.details.push('Please check the date of birth');
    }

    if (moment().diff(formattedDob, 'years') >= 125) {
      message.fields.push('dateOfBirth');
      message.details.push('Please check the date of birth');
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  validate.validators.dashboardEndDate = function(value, req, key, attributes) {
    var message = {
        summary: 'Check the end date',
        fields: [],
        details: [],
      }
      , startDate
      , endDate;

    startDate = attributes.startYear + '-' + attributes.startMonth + '-01';
    endDate = attributes.endYear + '-' + attributes.endMonth + '-01';

    if ((moment(startDate, 'YYYY-MM-DD', true).isValid() === true) && (moment(endDate, 'YYYY-MM-DD', true).isValid() === true)){
      if (moment(moment(endDate, 'YYYY-MM-DD', true)).isBefore(moment(startDate, 'YYYY-MM-DD', true))) {
        message.details='Check the end date is later than the start date';
        message.summary='Check the end date is later than the start date';
      }
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  validate.validators.dashboardMonth = function(value, req, key, attributes) {
    var message = {
        summary: '',
        summaryLink: key,
        fields: key,
        details: [],
      }
      , valueRegex = /^[0-9]{1,2}$/
      , errMessage = '';

    if ((value > 12 || value < 1) || !valueRegex.test(value)) {
      errMessage = 'Check the ' + filters.prettify(key).toLowerCase();
    }

    if (errMessage){
      message.details.push(errMessage);
      message.summary = errMessage;
      return message;
    }

    return null;
  };

  validate.validators.dashboardYear = function(value, req, key, attributes) {
    var message = {
        summary: '',
        summaryLink: key,
        fields: key,
        details: [],
      }
      , valueRegex = /^[0-9]{4}$/
      , errMessage = '';

    if ((value < 2019) || !valueRegex.test(value)) {
      errMessage = 'Check the ' + filters.prettify(key).toLowerCase();
    }

    if (errMessage){
      message.details.push(errMessage);
      message.summary = errMessage;
      return message;
    }

    return null;
  };

  // Checks for Deferral / Excusal dashboard

  validate.validators.dashboardStartDateRange = function(value, req, key, attributes) {
    var message = {
        summary: 'Check the start date',
        fields: [],
        details: [],
      }
      , dateError = false;

    if (moment(attributes.startDate, 'YYYY-MM-DD', true).isValid() === false){
      dateError = true;
      message.details = 'Check the start date';
      message.summary = 'Check the start date';
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };

  validate.validators.dashboardEndDateRange = function(value, req, key, attributes) {
    var message = {
        summary: 'Check the end date',
        fields: [],
        details: [],
      }
      , startDate
      , endDate;

    startDate = attributes.startDate;
    endDate = attributes.endDate;

    if (moment(endDate, 'YYYY-MM-DD', true).isValid() === false){
      message.details='Check the end date';
      message.summary='Check the end date';
    } else if (moment(startDate, 'YYYY-MM-DD', true).isValid() === true){
      if (moment(moment(endDate, 'YYYY-MM-DD', true)).isBefore(moment(startDate, 'YYYY-MM-DD', true))) {
        message.details='Check the end date is not earlier than the start date';
        message.summary='Check the end date is not earlier than the start date';
      }
    }

    // Feedback
    if (message.details.length > 0) {
      return message;
    }

    return null;
  };


  // Validates that a field has a value only if the linked
  // field has a pre-specified value.
  validate.validators.presenceIf = function(value, options, key, attributes) {
    var message;

    // We can't do much if we don't have a linked field
    if (options === false || typeof options.field === 'undefined') {
      return null;
    }

    // Return A-Ok if our linked field does not have the value
    // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // If we have reached this point then we have failed validation
    return message;
  };


  // Validates that a field has a valid email only if the linked
  // field has a pre-specified value.
  validate.validators.emailIf = function(value, options, key, attributes) {
    var message
      , emailRegex;

    // We can't do much if we don't have a linked field
    if (options === false || typeof options.field === 'undefined') {
      return null;
    }

    // Return A-Ok if our linked field does not have the value
    // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // If our validated field has a value, validate it is a valid email
    if (typeof value !== 'undefined' && value.length > 0) {
      // Valid email
      // eslint-disable-next-line max-len
      emailRegex = /^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
      if (emailRegex.test(value)) {
        return null;
      }
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // If we have reached this point then we have failed validation
    return message;
  };

  // Validates that a field has a value only if the linked
  // field has a pre-specified value.
  validate.validators.eitherField = function(value, options, key, attributes) {
    var message;

    // We can't do much if we don't have a linked field
    if ((options === false || typeof options.field === 'undefined') && (typeof options.value !== 'undefined' && attributes[options.field] !== options.value)) {
      return null;
    }

    // // Return A-Ok if our linked field does not have the value
    // // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // // If our validated field has a value, everything is A-Ok
    if (typeof value !== 'undefined' && value.length > 0) {
      return null;
    }

    if (attributes[options.group[0]] !== '' || attributes[options.group[1]] !== '') {
      return null;
    }

    // // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // If we have reached this point then we have failed validation
    return message;
  };


  validate.validators.validDeferralDate = function(value, options, key, attributes) {
    var message
      , dateValid
      , deferDate
      , minDeferDate
      , maxDeferDate;

    // We can't do much if we don't have a linked field
    if (options === false || typeof options.field === 'undefined') {
      return null;
    }

    // Return A-Ok if our linked field does not have the value
    // that triggers this field to be required.
    if (Array.isArray(attributes[options.field])) {
      if (attributes[options.field].indexOf(options.value) === -1) {
        return null;
      }
    } else if (typeof options.value !== 'undefined' && attributes[options.field] !== options.value) {
      return null;
    }

    // If our validated field has a value, validate the date value
    if (typeof value !== 'undefined' && value.length > 0) {

      dateValid = moment(value, 'D/M/YYYY').isValid();
      deferDate = moment(value, 'D/M/YYYY');
      minDeferDate = moment(attributes[options.minDate], 'D/M/YYYY');
      maxDeferDate = moment(attributes[options.minDate], 'D/M/YYYY').add(12, 'M');
      if (dateValid){
        if (deferDate.isSameOrAfter(minDeferDate) && deferDate.isSameOrBefore(maxDeferDate)){
          return null;
        }
      }
    }

    // Check what our return message should be
    if (typeof options.message === 'undefined') {
      message = 'Please check your {{ field }}'.replace('{{ field }}', filters.prettify(key));
    } else if (typeof options.message === 'function') {
      message = options.message(value, key);
    } else {
      message = options.message;
    }

    // If we have reached this point then we have failed validation
    return message;
  };

  validate.validators.searchParameters = function(value, req, key, attributes) {
    var message = {
        summary: '',
        summaryLink: 'jurorNumber',
        fields: [],
        details: [],
      }
      , searchParams = false
      , strMessage = '';

    if (isTeamLeader(req)){
      // Team leads
      strMessage = 'Enter a juror number, a juror\'s last name, a juror\'s pool number or advanced criteria to search';
      searchParams = attributes.juror_number.trim()
        || attributes.last_name.trim()
        || attributes.pool_number.trim()
        || attributes.officer_assigned.trim()
        || attributes.processing_status
        || attributes.is_urgent;
    } else {
      strMessage = 'Enter a juror number, a juror\'s last name or a juror\'s pool number to search';
      searchParams = attributes.juror_number.trim()
        || attributes.last_name.trim()
        || attributes.pool_number.trim();
    }

    if (!searchParams){
      message.details = strMessage;
      message.summary = strMessage;
    }

    if (message.details.length > 0) {
      return message;
    }

    return null;
  };


  function getCourtNumberIdent(courtKey) {
    var courtNumber = courtKey.replace('court_', '');

    return ordinalSuffixOf(courtNumber);
  }

  function ordinalSuffixOf(i) {
    var j = i % 10
      , k = i % 100;

    if (j === 1 && k !== 11) {
      return i + 'st';
    }
    if (j === 2 && k !== 12) {
      return i + 'nd';
    }
    if (j === 3 && k !== 13) {
      return i + 'rd';
    }

    return i + 'th';
  }
})();
