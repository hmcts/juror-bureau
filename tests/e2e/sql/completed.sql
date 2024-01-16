-- Juror 1
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    209092530, 'Jane', 'Castillo', 'jcastillo0@ed.gov', 'Dr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (209092530, (select sysdate from dual)+1/24);

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Dr',
  FIRST_NAME = 'Jane',
  LAST_NAME = 'Castillo',
  ADDRESS = '4 Knutson Trail', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 3RY',
  PROCESSING_STATUS = 'CLOSED',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6993',
  ALT_PHONE_NUMBER = '44(145)525-2390',
  EMAIL = 'jcastillo0@ed.gov',
  RESIDENCY='Y',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N',
  COMPLETED_AT=(SELECT SYSDATE FROM DUAL)


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



-- Juror 2
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    309092530, 'John', 'Doe', 'john.doe@mystery.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 4RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (309092530, (select sysdate from dual));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Dr',
  FIRST_NAME = 'Jon',
  LAST_NAME = 'Doey',
  ADDRESS = '5 Trail Street', ADDRESS2 = 'Aberdeen', ADDRESS3 = 'Scotland', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 5RY',
  PROCESSING_STATUS = 'CLOSED',
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

  DEFERRAL_REASON = 'I am busy with exams',
  DEFERRAL_DATE = TO_DATE('2017-06-06', 'YYYY-MM-DD'),

  SPECIAL_NEEDS_ARRANGEMENTS = 'Even more special reasons',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N',
  COMPLETED_AT=(SELECT SYSDATE FROM DUAL) + 1/24

  WHERE JUROR_NUMBER = 309092530;

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_CJS_EMPLOYMENT (
  JUROR_NUMBER,CJS_EMPLOYER,CJS_EMPLOYER_DETAILS,ID) values (
    '309092530','HM Prison Service','Prison guard',1);

INSERT INTO JUROR_DIGITAL.JUROR_RESPONSE_SPECIAL_NEEDS (
  JUROR_NUMBER,SPEC_NEED,SPEC_NEED_DETAIL,ID) values (
    '309092530','D','the juror seems to have severe allergy to nuts. Caution needed during lunch ',1);

-- Juror 3
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    301082530, 'John', 'Doe', 'john.doe@mystery.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Trail Street', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 4RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (301082530, (select sysdate from dual)+3/24);

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Jason',
  LAST_NAME = 'Doey',
  ADDRESS = '5 Trail Street', ADDRESS2 = 'Aberdeen', ADDRESS3 = 'Scotland', ADDRESS4 = 'United Kingdom', ZIP = 'AB21 5RY',
  PROCESSING_STATUS = 'CLOSED',
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
  SUPER_URGENT='N',
  COMPLETED_AT=(SELECT SYSDATE FROM DUAL) - 1/24

  WHERE JUROR_NUMBER = 301082530;
