'use strict';

const PII_KEYS = [
  'email', 'phone', 'mobile',
  'name',
  'address', 'city', 'town', 'county', 'postcode', 'zip',
  'dob', 'dateofbirth',
  'sortcode', 'accountnumber',
];
const SECRET_KEYS = [
  'authorization', 'token', 'jwt', 'jti', 'iat', 'exp',
];
const LOG_LEVELS = ['fatal', 'crit', 'warn', 'info', 'debug', 'trace'];
const FULL_REDACTION = '[REDACTED]';
const CIRCULAR_VALUE = '[Circular]';
const UNREADABLE_VALUE = '[Unreadable]';

function normaliseKey (key) {
  return Array.from(String(key))
    .filter(isLetterOrNumber)
    .join('')
    .toLowerCase();
}

function keyParts (key) {
  const parts = [];
  let part = '';

  Array.from(String(key)).forEach((character) => {
    if (!isLetterOrNumber(character)) {
      if (part) {
        parts.push(part.toLowerCase());
        part = '';
      }
      return;
    }

    if (part && isUpperCaseLetter(character) && !isUpperCaseLetter(part.slice(-1))) {
      parts.push(part.toLowerCase());
      part = '';
    }

    part += character;
  });

  if (part) {
    parts.push(part.toLowerCase());
  }

  return parts;
}

function isLetterOrNumber (character) {
  const code = character.charCodeAt(0);

  return code >= 48 && code <= 57
    || code >= 65 && code <= 90
    || code >= 97 && code <= 122;
}

function isUpperCaseLetter (character) {
  const code = character.charCodeAt(0);

  return code >= 65 && code <= 90;
}

function keyMatches (key, candidates) {
  const normalised = normaliseKey(key);
  const parts = keyParts(key);

  return candidates.some((candidate) => normalised === candidate
    || parts.includes(candidate));
}

function partiallyRedact (value) {
  const input = String(value);
  const characters = Array.from(input);
  const visibleCharacters = characters.filter(isLetterOrNumber);

  if (visibleCharacters.length <= 2) {
    return characters
      .map((character) => isLetterOrNumber(character) ? '*' : character)
      .join('');
  }

  const visibleAtEachEnd = visibleCharacters.length >= 8 ? 2 : 1;
  let position = 0;

  return characters.map((character) => {
    if (!isLetterOrNumber(character)) {
      return character;
    }

    position += 1;
    return position <= visibleAtEachEnd
      || position > visibleCharacters.length - visibleAtEachEnd
      ? character
      : '*';
  }).join('');
}

function redactPatterns (value) {
  return redactLongNumbers(redactEmails(value));
}

function redactEmails (value) {
  const characters = Array.from(value);

  characters.forEach((character, atIndex) => {
    if (character !== '@') {
      return;
    }

    let start = atIndex;
    let end = atIndex;

    while (start > 0 && isEmailCharacter(characters[start - 1], false)) {
      start -= 1;
    }
    while (end + 1 < characters.length && isEmailCharacter(characters[end + 1], true)) {
      end += 1;
    }

    const domain = characters.slice(atIndex + 1, end + 1);
    if (start < atIndex && domain.includes('.')) {
      replaceRange(characters, start, end, partiallyRedact(characters.slice(start, end + 1).join('')));
    }
  });

  return characters.join('');
}

function redactLongNumbers (value) {
  const characters = Array.from(value);
  let index = 0;

  while (index < characters.length) {
    if (!isNumber(characters[index]) && characters[index] !== '+') {
      index += 1;
      continue;
    }

    const start = index;
    let digitCount = 0;

    while (index < characters.length && isPhoneCharacter(characters[index])) {
      if (isNumber(characters[index])) {
        digitCount += 1;
      }
      index += 1;
    }

    let end = index - 1;
    while (end >= start && !isNumber(characters[end])) {
      end -= 1;
    }

    if (digitCount >= 9 && end >= start) {
      replaceRange(characters, start, end, partiallyRedact(characters.slice(start, end + 1).join('')));
    }
  }

  return characters.join('');
}

function isEmailCharacter (character, isDomain) {
  const extraCharacters = isDomain ? '.-' : '._%+-';

  return isLetterOrNumber(character) || extraCharacters.includes(character);
}

function isNumber (character) {
  const code = character.charCodeAt(0);

  return code >= 48 && code <= 57;
}

function isPhoneCharacter (character) {
  return isNumber(character) || ' +()-'.includes(character);
}

function replaceRange (characters, start, end, replacement) {
  characters.splice(start, end - start + 1, ...Array.from(replacement));
}

function redactSensitiveValue (value) {
  if (value === null || typeof value === 'undefined') {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return partiallyRedact(value);
  }
  if (value instanceof Date) {
    return partiallyRedact(value.toISOString());
  }
  if (Array.isArray(value)) {
    return value.map(redactSensitiveValue);
  }

  return FULL_REDACTION;
}

function sanitise (value, seen = new WeakSet()) {
  if (typeof value === 'string') {
    return redactPatterns(value);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return CIRCULAR_VALUE;
  }

  seen.add(value);

  if (value instanceof Date) {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return FULL_REDACTION;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitise(item, seen));
  }

  if (value instanceof Error) {
    const errorOutput = {
      name: value.name,
      message: redactPatterns(value.message),
      stack: redactPatterns(value.stack || ''),
    };

    Object.keys(value).forEach((key) => {
      errorOutput[key] = sanitiseProperty(key, value[key], seen);
    });

    return errorOutput;
  }

  const output = {};
  const keys = Object.keys(value);

  keys.forEach((key) => {
    output[key] = sanitiseProperty(key, value[key], seen);
  });

  return output;
}

function sanitiseProperty (key, value, seen) {
  if (keyMatches(key, SECRET_KEYS)) {
    return value === null || typeof value === 'undefined' ? value : FULL_REDACTION;
  }
  if (keyMatches(key, PII_KEYS)) {
    return redactSensitiveValue(value);
  }

  return sanitise(value, seen);
}

function sanitiseLog (logger, levels = LOG_LEVELS) {
  if (!logger || typeof logger.log !== 'function') {
    return logger;
  }

  const levelNames = Array.isArray(levels) ? levels : Object.keys(levels);

  levelNames.forEach((level) => {
    if (typeof logger[level] !== 'function') {
      return;
    }

    const writeLog = logger[level].bind(logger);
    logger[level] = function () {
      const args = Array.prototype.slice.call(arguments).map((argument) => {
        try {
          return sanitise(argument);
        } catch {
          return UNREADABLE_VALUE;
        }
      });
      return writeLog.apply(logger, args);
    };
  });

  return logger;
}

module.exports = {
  partiallyRedact,
  sanitise,
  sanitiseLog,
};
