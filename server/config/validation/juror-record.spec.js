(function() {
  'use strict';

  var validate = require('validate.js')
    , jurorRecordVal = require('./juror-record')
    , validatorResult = null;

  describe('Juror record validators:', function() {

    beforeEach(function() {
      validatorResult = null;
    });

    it('should validate the contact log form - happy path', function() {
      var mockRequest = {
        repeatEnquiry: true,
        enquiryType: 'General',
        notes: 'Some notes',
      };

      validatorResult = validate(mockRequest, jurorRecordVal.contactLog());

      expect(validatorResult).to.be.undefined;
    });

    it('should validate the contact log form - missing repeat enquiry', function() {
      var mockRequest = {
        enquiryType: 'General',
        notes: 'Some notes',
      };

      validatorResult = validate(mockRequest, jurorRecordVal.contactLog());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('repeatEnquiry');
      expect(validatorResult.repeatEnquiry).to.be.instanceof(Array);
      expect(validatorResult.repeatEnquiry[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.repeatEnquiry[0].summary).to.equal('Please indicate if this is a repeated enquiry');
      expect(validatorResult.repeatEnquiry[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.repeatEnquiry[0].details).to.equal('Repeated enquiry is missing');
    });

    it('should validate the contact log form - missing enquiry type', function() {
      var mockRequest = {
        repeatEnquiry: true,
        notes: 'Some notes',
      };

      validatorResult = validate(mockRequest, jurorRecordVal.contactLog());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('enquiryType');
      expect(validatorResult.enquiryType).to.be.instanceof(Array);
      expect(validatorResult.enquiryType[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.enquiryType[0].summary).to.equal('Please select the enquiry type');
      expect(validatorResult.enquiryType[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.enquiryType[0].details).to.equal('Enquiry type is missing');
    });

    it('should validate the contact log form - missing notes', function() {
      var mockRequest = {
        repeatEnquiry: true,
        enquiryType: 'General',
      };

      validatorResult = validate(mockRequest, jurorRecordVal.contactLog());

      expect(validatorResult).to.be.an('object');
      expect(validatorResult).to.have.ownPropertyDescriptor('notes');
      expect(validatorResult.notes).to.be.instanceof(Array);
      expect(validatorResult.notes[0]).to.have.ownPropertyDescriptor('summary');
      expect(validatorResult.notes[0].summary).to.equal('Please enter the contact-log notes');
      expect(validatorResult.notes[0]).to.have.ownPropertyDescriptor('details');
      expect(validatorResult.notes[0].details).to.equal('Notes is missing');
    });

    it('should validate the approve or reject form - happy path', function() {
      const approved = {
        decision: 'APPROVE',
        approveMessage: 'Approved message',
      };
      const rejected = {
        decision: 'REJECT',
        rejectMessage: 'Rejected message',
      };

      const approvedValidation = jurorRecordVal.nameChangeValidator(approved);

      expect(approvedValidation).to.be.null;

      const rejectedValidation = jurorRecordVal.nameChangeValidator(rejected);

      expect(rejectedValidation).to.be.null;
    });

    it('should validate the approve or reject form - empty messages', function() {
      const approved = {
        decision: 'APPROVE',
        approveMessage: '',
      };
      const rejected = {
        decision: 'REJECT',
        rejectMessage: '',
      };

      const approvedValidation = jurorRecordVal.nameChangeValidator(approved);

      expect(approvedValidation).to.be.an('object');
      expect(approvedValidation).to.have.ownProperty('approve-message');
      expect(approvedValidation['approve-message']).to.be.instanceof(Array);
      expect(approvedValidation['approve-message'][0]).to.have.ownPropertyDescriptor('summary');
      expect(approvedValidation['approve-message'][0].summary)
        .to.equal('Enter what evidence the juror provided for their change of name');
      expect(approvedValidation['approve-message'][0]).to.have.ownPropertyDescriptor('details');
      expect(approvedValidation['approve-message'][0].details)
        .to.equal('Enter what evidence the juror provided for their change of name');

      const rejectedValidation = jurorRecordVal.nameChangeValidator(rejected);

      expect(rejectedValidation).to.be.an('object');
      expect(rejectedValidation).to.have.ownProperty('reject-message');
      expect(rejectedValidation['reject-message']).to.be.instanceof(Array);
      expect(rejectedValidation['reject-message'][0]).to.have.ownPropertyDescriptor('summary');
      expect(rejectedValidation['reject-message'][0].summary)
        .to.equal('Enter why you rejected the juror’s name change');
      expect(rejectedValidation['reject-message'][0]).to.have.ownPropertyDescriptor('details');
      expect(rejectedValidation['reject-message'][0].details)
        .to.equal('Enter why you rejected the juror’s name change');
    });

    it('should validate the approve or reject form - messages too long', function() {
      const approved = {
        decision: 'APPROVE',
        // eslint-disable-next-line max-len
        approveMessage: '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',
      };
      const rejected = {
        decision: 'REJECT',
        // eslint-disable-next-line max-len
        rejectMessage: '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',
      };

      const approvedValidation = jurorRecordVal.nameChangeValidator(approved);

      expect(approvedValidation).to.be.an('object');
      expect(approvedValidation).to.have.ownProperty('approve-message');
      expect(approvedValidation['approve-message']).to.be.instanceof(Array);
      expect(approvedValidation['approve-message'][0]).to.have.ownPropertyDescriptor('summary');
      expect(approvedValidation['approve-message'][0].summary)
        .to.equal('Change of name evidence must be 2000 characters or less');
      expect(approvedValidation['approve-message'][0]).to.have.ownPropertyDescriptor('details');
      expect(approvedValidation['approve-message'][0].details)
        .to.equal('Change of name evidence must be 2000 characters or less');

      const rejectedValidation = jurorRecordVal.nameChangeValidator(rejected);

      expect(rejectedValidation).to.be.an('object');
      expect(rejectedValidation).to.have.ownProperty('reject-message');
      expect(rejectedValidation['reject-message']).to.be.instanceof(Array);
      expect(rejectedValidation['reject-message'][0]).to.have.ownPropertyDescriptor('summary');
      expect(rejectedValidation['reject-message'][0].summary)
        .to.equal('Reason for rejecting the name change must be 2000 characters or less');
      expect(rejectedValidation['reject-message'][0]).to.have.ownPropertyDescriptor('details');
      expect(rejectedValidation['reject-message'][0].details)
        .to.equal('Reason for rejecting the name change must be 2000 characters or less');
    });

  });
})();
