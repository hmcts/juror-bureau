INSERT into JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) values (400, 'Username', '8be3c943b1609fff', (select sysdate from dual) - 3, 1, 123456789, 12345678.12, (select sysdate from dual) - 3, 'Y');INSERT INTO JUROR_DIGITAL.APP_SETTINGS (SETTING,VALUE) VALUES ('URGENCY_DAYS','10');

INSERT INTO JUROR_DIGITAL.APP_SETTINGS (SETTING,VALUE) VALUES ('SLA_OVERDUE_DAYS','5');
Insert into JUROR_DIGITAL.APP_SETTINGS (SETTING,VALUE) values ('STRAIGHT_THROUGH_DISABLED','TRUE');
Insert into JUROR_DIGITAL.APP_SETTINGS (SETTING,VALUE) values ('bureauOfficerSearchResultLimit','100');
Insert into JUROR_DIGITAL.APP_SETTINGS (SETTING,VALUE) values ('teamLeaderSearchResultLimit','200');

INSERT INTO JUROR_DIGITAL.STAFF (LOGIN, NAME, ACTIVE, RANK, VERSION) VALUES ('AUTO', 'AUTO', 1, -1, 0);
