INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, address5, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status, notes) VALUES (
    301082531, 'Jake', 'Doe', 'jake.doe@mystery.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    'First street', 'Second street', 'Third street', 'Mystery town', 'Mystery county', 'AB21 4RY',
    '0141 123 4321', '', 'Y', 400, 446, '0141 123 4322', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1, 'Default notes for testing');

INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, address5, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status, notes) VALUES (
    301082532, 'Jakey', 'Boy', 'jakey.boy@mystery.gov', 'Lord', TO_DATE('1984-08-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    'First street', 'Second street', 'Third street', 'Mystery town', 'Mystery county', 'AB21 4RY',
    '0141 123 4321', '', 'Y', 400, 446, '0141 123 4322', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1, 'Default notes for testing');

  INSERT INTO JUROR.POOL (
    part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, address5, zip,
    h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
    on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status, notes) VALUES (
      123456789, 'Tony', 'Bordeaux', 'tony.bordeaux@email.com', 'Mr', TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
      'Street one', 'Street two', 'Street three', 'Town', 'County', 'AB21 5RY',
      '333333333', '', 'Y', 400, 446, '333333334', 'N', 21112, 555,
      'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1, 'Default notes for testing');

  INSERT INTO JUROR.POOL (
    part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, address5, zip,
    h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
    on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status, notes) VALUES (
      123456790, 'Marilyn', 'Vigoda', 'm.vigoda@email.com', 'Mr', TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
      'Street one', 'Street two', 'Street three', 'Town', 'County', 'AB21 5RY',
      '333333333', '', 'Y', 400, 446, '333333334', 'N', 21112, 555,
      'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1, 'Default notes for testing');

INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (301082531, (select sysdate from dual));
INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (301082532, (select sysdate from dual));
INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456789, (select sysdate from dual));
INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456790, (select sysdate from dual));


UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Jake',
  LAST_NAME = 'Doey',
  ADDRESS = 'Street one', ADDRESS2 = 'Street two', ADDRESS3 = 'Street three', ADDRESS4 = 'Town', ADDRESS5 = 'County', ZIP = 'AB21 5RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '0141 123 4323',
  ALT_PHONE_NUMBER = '0141 123 4324',
  EMAIL = 'jake.doey@mystery.gov',

  RESIDENCY='N',
  RESIDENCY_DETAIL='I have lived here for 3 years',
  MENTAL_HEALTH_ACT='Y',
  MENTAL_HEALTH_ACT_DETAILS='I am mentally detained',
  BAIL='Y',
  BAIL_DETAILS='I am on bail',
  CONVICTIONS='Y',
  CONVICTIONS_DETAILS='I have been convicted',

  THIRDPARTY_FNAME='Steve',
  THIRDPARTY_LNAME='Doey',
  RELATIONSHIP='Brother',
  THIRDPARTY_REASON='other',
  THIRDPARTY_OTHER_REASON='Holiday reason',
  MAIN_PHONE='01411411414',
  OTHER_PHONE='01411411415',
  EMAIL_ADDRESS='steve.doey@mystery.gov',
  DEFERRAL_REASON = 'I am busy with exams',
  DEFERRAL_DATE = TO_DATE('2017-06-06', 'YYYY-MM-DD'),

  SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N',

  JUROR_PHONE_DETAILS='Y',
  JUROR_EMAIL_DETAILS='Y'

  WHERE JUROR_NUMBER = 301082531;

  UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
    TITLE = 'Mr',
    FIRST_NAME = 'Jakey',
    LAST_NAME = 'Boy',
    ADDRESS = 'Street one', ADDRESS2 = 'Street two', ADDRESS3 = 'Street three', ADDRESS4 = 'Town', ADDRESS5 = 'County', ZIP = 'AB21 5RY',
    PROCESSING_STATUS = 'TODO',
    DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    PHONE_NUMBER = '0141 123 4323',
    ALT_PHONE_NUMBER = '0141 123 4324',
    EMAIL = 'jake.doey@mystery.gov',

    RESIDENCY='N',
    RESIDENCY_DETAIL='I have lived here for 3 years',
    MENTAL_HEALTH_ACT='Y',
    MENTAL_HEALTH_ACT_DETAILS='I am mentally detained',
    BAIL='Y',
    BAIL_DETAILS='I am on bail',
    CONVICTIONS='Y',
    CONVICTIONS_DETAILS='I have been convicted',

    SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
    STAFF_LOGIN='samanthak',
    STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
    URGENT='N',
    SUPER_URGENT='N',

    JUROR_PHONE_DETAILS='Y',
    JUROR_EMAIL_DETAILS='Y'

    WHERE JUROR_NUMBER = 301082532;

  UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
    TITLE = 'Mr',
    FIRST_NAME = 'Tony',
    LAST_NAME = 'Bordeaux',
    ADDRESS = 'Street one', ADDRESS2 = 'Street two', ADDRESS3 = 'Street three', ADDRESS4 = 'Town', ADDRESS5 = 'County', ZIP = 'AB21 5RY',
    PROCESSING_STATUS = 'TODO',
    DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    PHONE_NUMBER = '333333333',
    EMAIL = 'tony.bordeaux@email.com',

    RESIDENCY='N',
    RESIDENCY_DETAIL='I have lived here for 3 years',
    MENTAL_HEALTH_ACT='Y',
    MENTAL_HEALTH_ACT_DETAILS='I am mentally detained',
    BAIL='Y',
    BAIL_DETAILS='I am on bail',
    CONVICTIONS='Y',
    CONVICTIONS_DETAILS='I have been convicted',

    SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
    STAFF_LOGIN='samanthak',
    STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
    URGENT='N',
    SUPER_URGENT='N',

    THIRDPARTY_FNAME='Jonny',
    THIRDPARTY_LNAME='Bordeaux',
    RELATIONSHIP='Brother',
    MAIN_PHONE='333333333',
    OTHER_PHONE='333333334',
    EMAIL_ADDRESS='3rdparty@email.com',
    THIRDPARTY_REASON='nothere',

    JUROR_PHONE_DETAILS='N',
    JUROR_EMAIL_DETAILS='Y'

    WHERE JUROR_NUMBER = 123456789;

    UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
      TITLE = 'Mr',
      FIRST_NAME = 'Marilyn',
      LAST_NAME = 'Vigoda',
      ADDRESS = 'Street one', ADDRESS2 = 'Street two', ADDRESS3 = 'Street three', ADDRESS4 = 'Town', ADDRESS5 = 'County', ZIP = 'AB21 5RY',
      PROCESSING_STATUS = 'TODO',
      DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),

      RESIDENCY='Y',
      MENTAL_HEALTH_ACT='N',
      BAIL='N',
      CONVICTIONS='N',

      STAFF_LOGIN='samanthak',
      STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
      URGENT='N',
      SUPER_URGENT='N',

      THIRDPARTY_FNAME='Original Paul',
      THIRDPARTY_LNAME='Vigoda',
      RELATIONSHIP='Brother',
      MAIN_PHONE='333333333',
      THIRDPARTY_REASON = 'deceased',

      JUROR_PHONE_DETAILS='N',
      JUROR_EMAIL_DETAILS='N'

      WHERE JUROR_NUMBER = 123456790;
