(function() {
  'use strict';

  module.exports.contactLog = function() {
    return {
      repeatEnquiry: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Repeated enquiry is missing',
            summary: 'Please indicate if this is a repeated enquiry',
          },
        },
      },
      enquiryType: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Enquiry type is missing',
            summary: 'Please select the enquiry type',
          },
        },
      },
      notes: {
        presence: {
          allowEmpty: false,
          message: {
            details: 'Notes is missing',
            summary: 'Please enter the contact-log notes',
          },
        },
        length: {
          maximum: 2000,
          message: {
            details: 'The notes provided are too long',
            summary: 'The notes provided are too long',
          },
        },
      },
    };
  };

  module.exports.nameChangeValidator = function(body) {
    const messages = {
      APPROVE: {
        empty: 'Enter what evidence the juror provided for their change of name',
        tooLong: 'Change of name evidence must be 2000 characters or less',
      },
      REJECT: {
        empty: 'Enter why you rejected the juror’s name change',
        tooLong: 'Reason for rejecting the name change must be 2000 characters or less',
      },
    };

    if (!body.decision) {
      return {
        'decision': [{
          summary: 'Select whether to approve or reject the name change',
          details: 'Select whether to approve or reject the name change',
        }],
      };
    }

    if (body.decision === 'APPROVE') {
      if (body.approveMessage === '') {
        return {
          'approve-message': [{
            summary: messages[body.decision].empty,
            details: messages[body.decision].empty,
          }],
        };
      }

      if (body.approveMessage.length > 2000) {
        return {
          'approve-message': [{
            summary: messages[body.decision].tooLong,
            details: messages[body.decision].tooLong,
          }],
        };
      }
    }

    if (body.decision === 'REJECT') {
      if (body.rejectMessage === '') {
        return {
          'reject-message': [{
            summary: messages[body.decision].empty,
            details: messages[body.decision].empty,
          }],
        };
      }

      if (body.rejectMessage.length > 2000) {
        return {
          'reject-message': [{
            summary: messages[body.decision].tooLong,
            details: messages[body.decision].tooLong,
          }],
        };
      }
    }

    return null;
  };

})();
