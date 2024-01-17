INSERT INTO JUROR.POOL (
  part_no, fname, lname, h_email, title, dob,
  address, address2, address3, address4, zip,
  h_phone, w_phone, is_active, owner, loc_code, m_phone, responded, poll_number, pool_no,
  on_call, completion_flag, read_only, contact_preference, reg_spc, ret_date, next_date, status) VALUES (
    [jurorNumber], '[firstName]', '[lastName]', '[email]', '[title]', TO_DATE('[dob] 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
    '[addressLineOne]', '[addressLineTwo]', '[addressLineThree]', '[addressLineFour]', '[addressPostcode]',
    '[hPhone]', '[wPhone]', 'Y', 400, [locCode], '[mPhone]', 'N', 21112, 555,
    'N', 'N', 'N', 0, 'N', (select sysdate from dual), TO_DATE('[dateSummoned] 00:00:00', 'YYYY-MM-DD HH24:MI:SS'), [poolStatus]);


INSERT INTO "JUROR_DIGITAL"."JUROR_RESPONSE" (JUROR_NUMBER, DATE_RECEIVED) VALUES ([jurorNumber], TO_DATE('[dateReceived] 00:00:00', 'YYYY-MM-DD HH24:MI:SS'));

UPDATE "JUROR_DIGITAL"."JUROR_RESPONSE" SET
  TITLE = '[title]',
  FIRST_NAME = '[firstName]',
  LAST_NAME = '[lastName]',
  ADDRESS = '[addressLineOne]',
  ADDRESS2 = '[addressLineTwo]',
  ADDRESS3 = '[addressLineThree]',
  ADDRESS4 = '[addressLineFour]',
  ZIP = '[addressPostcode]',
  PROCESSING_STATUS = '[processingStatus]',
  DATE_OF_BIRTH = TO_DATE('[dob] 00:00:00', 'YYYY-MM-DD HH24:MI:SS'),
  PHONE_NUMBER = '[hPhone]',
  ALT_PHONE_NUMBER = '[mPhone]',
  EMAIL = '[email]',
  RESIDENCY = 'Y',
  STAFF_LOGIN='[assignee]',
  STAFF_ASSIGNMENT_DATE=(select sysdate from dual),
  SUPER_URGENT='[superUrgent]',
  URGENT='[urgent]',
  COMPLETED_AT=[completedAt]

  WHERE JUROR_NUMBER = [jurorNumber];
