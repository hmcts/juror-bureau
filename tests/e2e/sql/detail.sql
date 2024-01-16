-- Juror 1
-- All happy
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    209092530, 'Jane', 'Castillo', 'jcastillo0@ed.gov', 'Dr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (209092530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Dr',
  FIRST_NAME = 'Jane',
  LAST_NAME = 'Castillo',
  ADDRESS = '4 Knutson Trail', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6993',
  ALT_PHONE_NUMBER = '44(145)525-2390',
  EMAIL = 'jcastillo0@ed.gov',
  RESIDENCY='Y',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 209092530;

INSERT INTO JUROR.PHONE_LOG (
  OWNER, PART_NO, USER_ID,
  START_CALL, END_CALL, PHONE_CODE,
  NOTES) VALUES (
    '400', '209092530', 'APerson',
    (SELECT SYSDATE-3 FROM DUAL), (SELECT SYSDATE-71/24 FROM DUAL), 'FA',
    'Can the court facilities support a nut free lunch?'
  );

INSERT INTO JUROR.PHONE_LOG (
  OWNER, PART_NO, USER_ID,
  START_CALL, END_CALL, PHONE_CODE,
  NOTES) VALUES (
    '400', '209092530', 'BPerson',
    (SELECT SYSDATE-4 FROM DUAL), (SELECT SYSDATE-71/24 FROM DUAL), 'EX',
    'Wanted expenses available for first class rail travel.'
  );

INSERT INTO JUROR_DIGITAL.CHANGE_LOG (
  ID, JUROR_NUMBER, TIMESTAMP, STAFF,
  TYPE, NOTES,
  VERSION) VALUES (
    100000, '209092530', (SELECT sysdate FROM dual),
    'samanthak', 'JUROR_DETAILS', 'Juror''s name was incorrect on the system', 0
  );

INSERT INTO JUROR_DIGITAL.CHANGE_LOG (
  ID, JUROR_NUMBER, TIMESTAMP, STAFF,
  TYPE, NOTES,
  VERSION) VALUES (
    200000, '209092530', (SELECT sysdate+30/(24*60) FROM dual),
    'samanthak', 'JUROR_DETAILS', 'Juror''s house number was incorrect on the system', 0
  );

INSERT INTO JUROR_DIGITAL.CHANGE_LOG_ITEM
  (ID, CHANGE_LOG, OLD_KEY, OLD_VALUE, NEW_KEY, NEW_VALUE, VERSION)
VALUES
  (100000, 100000, 'firstName', 'Janey', 'firstName', 'Jane', 0);
INSERT INTO JUROR_DIGITAL.CHANGE_LOG_ITEM
  (ID, CHANGE_LOG, OLD_KEY, OLD_VALUE, NEW_KEY, NEW_VALUE, VERSION)
VALUES
  (200000, 100000, 'lastName', 'Castilio', 'lastName', 'Castillo', 0);
INSERT INTO JUROR_DIGITAL.CHANGE_LOG_ITEM
  (ID, CHANGE_LOG, OLD_KEY, OLD_VALUE, NEW_KEY, NEW_VALUE, VERSION)
VALUES
  (300000, 200000, 'jurorAddress1', '4 Knutson Trail', 'jurorAddress1', '4a Knutson Trail', 0);


-- Juror 2
-- Changed personal details
-- Third party
-- Eligibility flagged
-- Deferred
-- CJS Employed
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    309092530, 'John', 'Doe', 'john.doe@mystery.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 4RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', TO_DATE('2099-01-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS'), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (309092530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Dr',
  FIRST_NAME = 'Jon',
  LAST_NAME = 'Doey',
  ADDRESS = '5 Trail Street', ADDRESS2 = 'Aberdeen', ADDRESS3 = 'Scotland', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 5RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6994',
  ALT_PHONE_NUMBER = '44(145)525-2391',
  EMAIL = 'jon.doey@mystery.gov',

  RESIDENCY='N',
  RESIDENCY_DETAIL='I have lived here for 3 years',
  MENTAL_HEALTH_ACT='Y',
  MENTAL_HEALTH_ACT_DETAILS='I am mentally detained',
  BAIL='Y',
  BAIL_DETAILS='I am on bail',
  CONVICTIONS='Y',
  CONVICTIONS_DETAILS='I have been convicted',

  THIRDPARTY_FNAME='Frank',
  THIRDPARTY_LNAME='Doey',
  RELATIONSHIP='Brother',
  THIRDPARTY_REASON='nothere',
  MAIN_PHONE='01411411414',
  OTHER_PHONE='01411411415',
  EMAIL_ADDRESS='frank.doey@mystery.gov',
  JUROR_PHONE_DETAILS='Y',
  JUROR_EMAIL_DETAILS='Y',

  DEFERRAL_REASON = 'I am busy with exams',
  DEFERRAL_DATE = '06/06/2017, 06/07/2017, 06/08/2017',

  SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 309092530;

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_CJS_EMPLOYMENT (
  JUROR_NUMBER,CJS_EMPLOYER,CJS_EMPLOYER_DETAILS,ID) values (
    '309092530','HM Prison Service','Prison guard',1);

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_SPECIAL_NEEDS (
  JUROR_NUMBER,SPEC_NEED,SPEC_NEED_DETAIL,ID) values (
    '309092530','D','the juror seems to have severe allergy to nuts. Caution needed during lunch ',1);

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_SPECIAL_NEEDS (
  JUROR_NUMBER,SPEC_NEED,SPEC_NEED_DETAIL,ID) values (
    '309092530','V','the juror has bad eyesight ',3);


-- Juror 3
-- Deceased
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    352004504, 'Jose', 'Rivera', 'jriverac@myspace.com', 'Rev', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '22177 Redwing Way', 'London', 'England', 'United Kingdom', 'EC3M 2NY',
    '44(406)759-6616', '44(322)292-4490', 'Y', 400, 446, '44(322)292-4490', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);

INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (352004504, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Rev',
  FIRST_NAME = 'Jose',
  LAST_NAME = 'Rivera',
  ADDRESS = '22177 Redwing Way',
  ADDRESS2 = 'London',
  ADDRESS3 = 'England',
  ADDRESS4 = 'United Kingdom',
  ZIP = 'EC3M 2NY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(406)759-6616',
  ALT_PHONE_NUMBER = '44(322)292-4490',
  EMAIL = 'jriverac@myspace.com',
  PROCESSING_COMPLETE = 'N',
  THIRDPARTY_FNAME = 'Jon',
  THIRDPARTY_LNAME = 'Deaves',
  RELATIONSHIP='Brother',
  THIRDPARTY_REASON = 'deceased',
  MAIN_PHONE='01411411414',
  OTHER_PHONE='01411411415',
  EMAIL_ADDRESS='jonD@mystery.gov',
  -- USE_JUROR_EMAIL = 'Y',
  -- USE_JUROR_PHONE = 'N'

  RESIDENCY = 'N',
  RESIDENCY_DETAIL = 'Lived in U.K. for 3 years',

  MENTAL_HEALTH_ACT = 'Y',
  MENTAL_HEALTH_ACT_DETAILS = 'I was detained',
  CONVICTIONS = 'Y',
  CONVICTIONS_DETAILS = 'I was convicted',
  BAIL = 'Y',
  BAIL_DETAILS = 'I am on bail because I was convicted',

  EXCUSAL_REASON = 'Need to be excused because of stuff',

  SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 352004504;

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_SPECIAL_NEEDS (JUROR_NUMBER,SPEC_NEED,SPEC_NEED_DETAIL,ID) VALUES ('352004504','O','the juror cannot sit for long period of \n time because of blood circulation issues',2);
INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_CJS_EMPLOYMENT (JUROR_NUMBER,CJS_EMPLOYER,CJS_EMPLOYER_DETAILS,ID) VALUES ('352004504','Police Force','Constubal',3);


-- Juror 4
-- Excusal
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    409092530, 'Jane', 'Doe', 'jane.doe@mystery.gov', 'Miss', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (409092530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Miss',
  FIRST_NAME = 'Jane',
  LAST_NAME = 'Doe',
  ADDRESS = '4 Trail Street', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'AWAITING_CONTACT',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6993',
  ALT_PHONE_NUMBER = '44(145)525-2390',
  EMAIL = 'jcastillo0@ed.gov',
  RESIDENCY='Y',
  EXCUSAL_REASON = 'I have stress induced anxiety',
  STAFF_LOGIN='jcambell',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 409092530;


-- Juror 5
-- Deferral
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    509092530, 'Jose', 'Doe', 'Jose.doe@mystery.gov', 'Miss', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (509092530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Miss',
  FIRST_NAME = 'Jose',
  LAST_NAME = 'Doe',
  ADDRESS = '4 Trail Street', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6993',
  ALT_PHONE_NUMBER = '44(145)525-2390',
  EMAIL = 'Jose.doe@mystery.gov',
  RESIDENCY='Y',

  DEFERRAL_REASON = 'I am busy with exams',
  DEFERRAL_DATE = TO_DATE('2017-06-06', 'YYYY-MM-DD'),
  STAFF_LOGIN='jcambell',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 509092530;


-- Juror 6
-- Unassigned
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    123251234, 'Gypsey', 'Hoola', 'jhoola@ed.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '27 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6991', '44(109)549-5621', 'Y', 400, 446, '44(145)525-2391', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123251234, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Gypsey',
  LAST_NAME = 'Hoola',
  ADDRESS = '27 Knutson Trail', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6991',
  ALT_PHONE_NUMBER = '44(145)525-2391',
  EMAIL = 'jhoola@ed.gov',
  RESIDENCY='Y',
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 123251234;


-- Juror 7
-- Age ineligible
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    509092531, 'Jose', 'Rivera', 'jriverac@myspace.com', 'Miss', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Aberdeen', 'Scotland', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (509092531, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Miss',
  FIRST_NAME = 'Jose',
  LAST_NAME = 'Rivera',
  ADDRESS = '4 Trail Street', ADDRESS2 = 'Aberdeen', ADDRESS3 = 'Scotland', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = (select sysdate from dual) - (365 * 17),
  PHONE_NUMBER = '44(703)209-6993',
  ALT_PHONE_NUMBER = '44(145)525-2390',
  EMAIL = 'jriverac@myspace.com',
  RESIDENCY = 'N',
  RESIDENCY_DETAIL = null,
  MENTAL_HEALTH_ACT = 'N',
  MENTAL_HEALTH_ACT_DETAILS = null,
  BAIL = 'N',
  BAIL_DETAILS = null,
  CONVICTIONS = 'N',
  CONVICTIONS_DETAILS = null,

  DEFERRAL_REASON = null,
  DEFERRAL_DATE = null,
  SPECIAL_NEEDS_ARRANGEMENTS = null,
  EXCUSAL_REASON = null,

  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual)

  WHERE JUROR_NUMBER = 509092531;

-- Juror 8
-- Changed personal details
-- Third party
-- Other reason
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status, notes) VALUES (
    301082530, 'John', 'Doe', 'john.doe@mystery.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 4RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1, 'Default notes for testing');


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (301082530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Jason',
  LAST_NAME = 'Doey',
  ADDRESS = '5 Trail Street', ADDRESS2 = 'Aberdeen', ADDRESS3 = 'Scotland', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 5RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1985-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6994',
  ALT_PHONE_NUMBER = '44(145)525-2391',
  EMAIL = 'jay.doey@mystery.gov',

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
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 301082530;

INSERT INTO JUROR.PHONE_LOG (
  OWNER, PART_NO, USER_ID,
  START_CALL, END_CALL, PHONE_CODE,
  NOTES) VALUES (
    '400', '301082530', 'APerson',
    (SELECT SYSDATE-3 FROM DUAL), (SELECT SYSDATE-71/24 FROM DUAL), 'FA',
    'Test phone log #1'
  );

INSERT INTO JUROR.PHONE_LOG (
  OWNER, PART_NO, USER_ID,
  START_CALL, END_CALL, PHONE_CODE,
  NOTES) VALUES (
    '400', '301082530', 'BPerson',
    (SELECT SYSDATE-60 FROM DUAL), (SELECT SYSDATE-71/24 FROM DUAL), 'FA',
    '#2 test phone log'
  );
