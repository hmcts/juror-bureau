;(function(){
  'use strict';

  module.exports.updateOptions = function() {
    return {
      jurorRecordUpdate: {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Select how you want to update the juror record',
            details: 'Select how you want to update the juror record'
          }
        },
      },

    };
  };
  module.exports.deceasedComment = function() {
    return {
      jurorDeceased:  {
        presence: {
          allowEmpty: false,
          message: {
            summary: 'Enter comments to record in the juror’s history',
            details: 'Enter comments to record in the juror’s history'
          }
        },
      },
    };
  };
})();
