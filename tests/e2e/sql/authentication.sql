--
-- Teams
INSERT INTO JUROR_DIGITAL.TEAM (ID, TEAM_NAME, VERSION) VALUES (1, 'London & Wales', 0);
INSERT INTO JUROR_DIGITAL.TEAM (ID, TEAM_NAME, VERSION) VALUES (2, 'South East, North East & North West', 0);
INSERT INTO JUROR_DIGITAL.TEAM (ID, TEAM_NAME, VERSION) VALUES (3, 'Midlands & South West', 0);

--
-- user with login enabled, password recently changed,
INSERT INTO JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) VALUES (400, 'samanthak', '5baa61e4c9b93f3f', (select sysdate from dual) - 3, 1, 123456789, 12345678.12, (select sysdate from dual) - 3, 'Y');
INSERT INTO JUROR_DIGITAL.STAFF (ACTIVE, LOGIN, NAME, RANK, TEAM_ID, VERSION, COURT_1, COURT_2, COURT_3, COURT_4, COURT_5, COURT_6, COURT_7, COURT_8, COURT_9, COURT_10) VALUES (1, 'samanthak', 'Samantha Kirkwood', 0, 1, 0, '120', '121', '122', '123', '124', '125', '126', '127', '128', '129');
--
-- user with login disabled, password recently changed
INSERT INTO JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) VALUES (400, 'johnsmith', '5baa61e4c9b93f3f', (select sysdate from dual) - 4, 1, 123456789, 12345678.12, (select sysdate from dual) - 4, 'N');
INSERT INTO JUROR_DIGITAL.STAFF (ACTIVE, LOGIN, NAME, RANK, TEAM_ID, VERSION) VALUES (0, 'johnsmith', 'John Smith', 0, 2, 0);
--
-- user with login enabled and password expired
INSERT INTO JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) VALUES (400, 'msmith', '5baa61e4c9b93f3f', (select sysdate from dual) - 150, 1, 123456789, 12345678.12, (select sysdate from dual) - 100, 'Y');
INSERT INTO JUROR_DIGITAL.STAFF (ACTIVE, LOGIN, NAME, RANK, TEAM_ID, VERSION) VALUES (1, 'msmith', 'Molly Smith', 0, 2, 0);
--
-- user with login enabled and password due to expire
INSERT INTO JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) VALUES (400, 'jcambell', '5baa61e4c9b93f3f', (select sysdate from dual) - 50, 1, 123456789, 12345678.12, (select sysdate from dual) - 80, 'Y');
INSERT INTO JUROR_DIGITAL.STAFF (ACTIVE, LOGIN, NAME, RANK, TEAM_ID, VERSION) VALUES (1, 'jcambell', 'James Cambell', 1, 1, 0);
--
-- user who will have no staff associated
INSERT INTO JUROR.PASSWORD (OWNER, LOGIN, PASSWORD, LAST_USED, USER_LEVEL, ARAMIS_AUTH_CODE, ARAMIS_MAX_AUTH, PASSWORD_CHANGED_DATE, LOGIN_ENABLED_YN) VALUES (400, 'jdeaves', '5baa61e4c9b93f3f', (select sysdate from dual) - 3, 1, 123456789, 12345678.12, (select sysdate from dual) - 3, 'Y');
