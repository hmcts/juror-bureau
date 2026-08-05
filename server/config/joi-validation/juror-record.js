const Joi = require('joi');
const { validateJoiSchema } = require('./index');

const contactLogMessageMapping = {
  repeatEnquirySummary: 'Please indicate if this is a repeated enquiry',
  repeatEnquiryDetails: 'Repeated enquiry is missing',
  enquiryTypeSummary: 'Please select the enquiry type',
  enquiryTypeDetails: 'Enquiry type is missing',
  notesSummary: 'Please enter the contact-log notes',
  notesDetails: 'Notes is missing',
  notesTooLongSummary: 'The notes provided are too long',
  notesTooLongDetails: 'The notes provided are too long',
};

const nameChangeMessageMapping = {
  decision: 'Select whether to approve or reject the name change',
  approveEmpty: 'Enter what evidence the juror provided for their change of name',
  approveTooLong: 'Change of name evidence must be 2000 characters or less',
  rejectEmpty: 'Enter why you rejected the juror’s name change',
  rejectTooLong: 'Reason for rejecting the name change must be 2000 characters or less',
};

const contactLogSchema = Joi.object({
  repeatEnquiry: Joi.any()
    .required()
    .messages({
      'any.required': contactLogMessageMapping.repeatEnquirySummary,
    }),
  enquiryType: Joi.string()
    .required()
    .invalid('select')
    .messages({
      'any.required': contactLogMessageMapping.enquiryTypeSummary,
      'string.empty': contactLogMessageMapping.enquiryTypeSummary,
      'any.invalid': contactLogMessageMapping.enquiryTypeSummary,
    }),
  notes: Joi.string()
    .required()
    .max(2000)
    .messages({
      'any.required': contactLogMessageMapping.notesSummary,
      'string.empty': contactLogMessageMapping.notesSummary,
      'string.max': contactLogMessageMapping.notesTooLongSummary,
    }),
});

const nameChangeSchema = Joi.object({
  decision: Joi.string()
    .required()
    .messages({
      'any.required': nameChangeMessageMapping.decision,
      'string.empty': nameChangeMessageMapping.decision,
    }),
  approveMessage: Joi.when('decision', {
    is: 'APPROVE',
    then: Joi.string()
      .required()
      .max(2000)
      .messages({
        'any.required': nameChangeMessageMapping.approveEmpty,
        'string.empty': nameChangeMessageMapping.approveEmpty,
        'string.max': nameChangeMessageMapping.approveTooLong,
      }),
    otherwise: Joi.any().optional(),
  }),
  rejectMessage: Joi.when('decision', {
    is: 'REJECT',
    then: Joi.string()
      .required()
      .max(2000)
      .messages({
        'any.required': nameChangeMessageMapping.rejectEmpty,
        'string.empty': nameChangeMessageMapping.rejectEmpty,
        'string.max': nameChangeMessageMapping.rejectTooLong,
      }),
    otherwise: Joi.any().optional(),
  }),
});

module.exports.contactLog = (body) => {
  const validationResult = validateJoiSchema(contactLogSchema, body);

  if (typeof validationResult === 'undefined') {
    return undefined;
  }

  if (validationResult.repeatEnquiry) {
    validationResult.repeatEnquiry[0].details = contactLogMessageMapping.repeatEnquiryDetails;
  }

  if (validationResult.enquiryType) {
    validationResult.enquiryType[0].details = contactLogMessageMapping.enquiryTypeDetails;
  }

  if (validationResult.notes) {
    validationResult.notes[0].details = validationResult.notes[0].summary === contactLogMessageMapping.notesTooLongSummary
      ? contactLogMessageMapping.notesTooLongDetails
      : contactLogMessageMapping.notesDetails;
  }

  return validationResult;
};

module.exports.nameChangeValidator = (body) => {
  const validationResult = validateJoiSchema(nameChangeSchema, body);

  if (typeof validationResult === 'undefined') {
    return null;
  }

  if (validationResult.approveMessage) {
    validationResult['approve-message'] = validationResult.approveMessage;
    delete validationResult.approveMessage;
  }

  if (validationResult.rejectMessage) {
    validationResult['reject-message'] = validationResult.rejectMessage;
    delete validationResult.rejectMessage;
  }

  return validationResult;
};
