'use strict';

const REDACTED = '[REDACTED]';
const CIRCULAR = '[Circular]';

const SENSITIVE_FIELDS = new Set([
  'account',
  'accountholder',
  'accountname',
  'accountnumber',
  'address',
  'apikey',
  'auth',
  'authentication',
  'authorization',
  'bankaccount',
  'birthdate',
  'city',
  'comment',
  'comments',
  'contactdetails',
  'contactlog',
  'cookie',
  'county',
  'dateofbirth',
  'dob',
  'email',
  'emailaddress',
  'initials',
  'ipaddress',
  'jwt',
  'mobile',
  'mobilenumber',
  'name',
  'nationalinsurancenumber',
  'ni',
  'nino',
  'note',
  'notes',
  'password',
  'passwd',
  'personaldetails',
  'phone',
  'phonenumber',
  'postcode',
  'refreshjwt',
  'session',
  'sessionid',
  'signature',
  'sortcode',
  'street',
  'telephone',
  'telephonenumber',
  'town',
  'user',
  'userdetails',
  'username',
  'zip',
  'zipcode',
]);

const PERSONAL_NAME_PREFIXES = new Set([
  'display', 'first', 'full', 'given', 'judge', 'juror', 'last', 'middle', 'new', 'old', 'sur', 'titleandfull', 'fore',
]);

const SENSITIVE_TEXT = new RegExp([
  '\\b(?:email(?: address)?|phone|mobile|telephone|name|address|postcode|date of birth|dob|'
    + 'national insurance(?: number)?|nino|sort code|account number|username|password|token)'
    + '\\s*(?:is|=|:)\\s*[^,;\\n]+',
  '\\bBearer\\s+[A-Za-z0-9._~+/=-]+',
  '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b',
  '(?<!\\w)(?:\\+44\\s?(?:\\(0\\)\\s?)?|0)(?:\\d[\\s().-]?){9,10}(?!\\d)',
  '\\b(?:GIR\\s?0AA|[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2})\\b',
  '\\b(?:AB|BG|GB|KN|NK|NT|TN|ZZ)\\s?\\d{6}\\s?[A-D]\\b',
  '\\b(?:\\d[ -]*?){13,19}\\b',
  '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
].map((pattern) => `(?:${pattern})`).join('|'), 'gi');

function isSensitiveField (field) {
  const normalised = normaliseField(field);

  return SENSITIVE_FIELDS.has(normalised)
    || normalised.includes('address')
    || normalised.endsWith('token')
    || normalised.endsWith('secret')
    || normalised.endsWith('name') && PERSONAL_NAME_PREFIXES.has(normalised.slice(0, -4));
}

function normaliseField (field) {
  let normalised = '';

  for (const character of String(field).toLowerCase()) {
    if ((character >= 'a' && character <= 'z') || (character >= '0' && character <= '9')) {
      normalised += character;
    }
  }

  return normalised;
}

function redactText (value) {
  return value.replace(SENSITIVE_TEXT, REDACTED);
}

function redactValue (value, seen = new WeakSet()) {
  try {
    if (typeof value === 'string') {
      return redactText(value);
    }
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (seen.has(value)) {
      return CIRCULAR;
    }

    seen.add(value);

    if (value instanceof Date) {
      return new Date(value);
    }
    if (Buffer.isBuffer(value)) {
      return REDACTED;
    }
    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, seen));
    }

    const output = value instanceof Error
      ? { name: redactText(value.name), message: redactText(value.message), stack: redactText(value.stack || '') }
      : {};

    Reflect.ownKeys(value).forEach((field) => {
      if (typeof field === 'symbol' || Object.prototype.hasOwnProperty.call(output, field)) {
        return;
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, field);

      output[field] = isSensitiveField(field)
        ? REDACTED
        : descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
          ? redactValue(descriptor.value, seen)
          : REDACTED;
    });

    return output;
  } catch {
    return REDACTED;
  }
}

function applyRedaction (logger) {
  if (!logger || typeof logger.log !== 'function') {
    return logger;
  }

  const writeLog = logger.log.bind(logger);

  logger.log = function () {
    return writeLog(...Array.from(arguments, (value) => redactValue(value)));
  };

  return logger;
}

module.exports = { REDACTED, applyRedaction, isSensitiveField, redactText, redactValue };
