--
-- Juror 1
--
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    123456789, 'Jane', 'Castillo', 'jcastillo0@ed.gov', 'Dr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '4 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB21 3RY',
    '44(703)209-6993', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2390', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456789, (select sysdate from dual));

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

  WHERE JUROR_NUMBER = 123456789;


--
-- Juror 2
--
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    123456788, 'Joan', 'Rivera', 'jrivera@ed.gov', 'Mrs', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '5 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB22 3RY',
    '44(703)209-6994', '44(109)549-5626', 'Y', 400, 446, '44(145)525-2391', 'N', 21112, 456,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456788, (select sysdate from dual) - 3);

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mrs',
  FIRST_NAME = 'Joan',
  LAST_NAME = 'Rivera',
  ADDRESS = '5 Knutson Trail', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB22 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6994',
  ALT_PHONE_NUMBER = '44(145)525-2391',
  EMAIL = 'jrivera@ed.gov',
  RESIDENCY='Y',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 123456788;


--
-- Juror 3
--
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    123456787, 'Frank', 'Rivera', 'frivera@ed.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '5 Knutson Trail', 'Scotland', 'Aberdeen', 'United Kingdom', 'AB22 3RY',
    '44(703)209-6994', '44(109)549-5626', 'Y', 400, 446, '44(145)525-2391', 'N', 21112, 456,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456787, (select sysdate from dual) - 6);

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Frank',
  LAST_NAME = 'Rivera',
  ADDRESS = '5 Knutson Trail', ADDRESS2 = 'Scotland', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB22 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6994',
  ALT_PHONE_NUMBER = '44(145)525-2391',
  EMAIL = 'frivera@ed.gov',
  RESIDENCY='Y',
  STAFF_LOGIN='samanthak',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='N',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 123456787;


--
-- Juror 3
--
INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob, address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    123456786, 'Joe', 'Blogs', 'jblogs@ed.gov', 'Mr', TO_DATE('1984-07-24 16:04:09', 'YYYY-MM-DD HH24:MI:SS'),
    '5 Knutson Trail', 'London', 'Aberdeen', 'United Kingdom', 'AB27 3RY',
    '44(703)209-6995', '44(109)549-5625', 'Y', 400, 446, '44(145)525-2395', 'N', 21112, 457,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), (select sysdate from dual) + 60, 1);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES (123456786, (select sysdate from dual) - 7);

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = 'Mr',
  FIRST_NAME = 'Joe',
  LAST_NAME = 'Blogs',
  ADDRESS = '5 Knutson Trail', ADDRESS2 = 'London', ADDRESS3 = 'Aberdeen', ADDRESS4 = 'United Kingdom', ZIP = 'AB27 3RY',
  PROCESSING_STATUS = 'TODO',
  DATE_OF_BIRTH = TO_DATE('1984-07-24 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '44(703)209-6995',
  ALT_PHONE_NUMBER = '44(145)525-2395',
  EMAIL = 'jblogs@ed.gov',
  RESIDENCY='Y',
  STAFF_LOGIN='jcambell',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  URGENT='Y',
  SUPER_URGENT='N'

  WHERE JUROR_NUMBER = 123456786;
