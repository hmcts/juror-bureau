;(function(){
  'use strict';

  const _ = require('lodash')
    , { timeMessageMapping } = require('../../config/validation/check-in-out-time')
    , checkInTimeValidator = require('../../config/validation/check-in-out-time').checkInTime
    , checkOutTimeValidator = require('../../config/validation/check-in-out-time').checkOutTime
    , { convertAmPmToLong } = require('../../components/filters')
    , validate = require('validate.js');

  module.exports.reassignPanel = function() {
    return {
      selectedJurors: {
        reassignPanelSelect: {
        },
      },
    };
  };

  validate.validators.returnJurorSelect = function(value, options, key, attributes) {
    if (!attributes.selectedJurors) {
      return {
        summary: 'Select at least one panel member to reassign',
        details: ['Select at least one panel member to reassign']
      }
    }

    return null;
  };

});