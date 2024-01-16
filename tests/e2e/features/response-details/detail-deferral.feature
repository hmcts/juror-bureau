Feature: Defer Juror Response

  As a Bureau officer, I want to accept a Juror's deferral request and select a new service date, so that the Juror will perform their service at a time that they can do

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail" data
      And I add a generated response with the juror number "223456789" and the status "AWAITING_CONTACT"
      And I add a generated response with the juror number "323456789" and the status "AWAITING_TRANSLATION"
      And I add a generated response with the juror number "423456789" and the status "AWAITING_COURT_REPLY"
      And I add a generated response with the juror number "523456789" and the status "CLOSED"

    # Ensure page cannot be accessed prior to login. #AC1 #AC2
    When I navigate to the Details page for response "309092530"
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the entry for juror number "309092530"
      Then the modal should not be on screen


    # Start Scenarios
    # -------------------------------------
    @JDB-39 @deferral @AC5 @AC6
    Scenario Outline: Response <jurorNumber> has the Reply status of <status>
      When I go directly to the "/response/<jurorNumber>" page

      Then the record status is "Summoned" on the detail page
        And the response status is "<status>"

      Examples:
      | jurorNumber | status                |
      | 309092530   | To do                 |
      | 223456789   | Awaiting juror        |
      | 323456789   | Awaiting translation  |
      | 423456789   | Awaiting court reply  |
      | 523456789   | Completed             |

    @JDB-39 @deferral @AC5 @AC7
    Scenario: The ‘Process reply’ drop down contains the correct options
      Then the response has the "Responded" option on Process reply dropdown
        And the response has the "Deferral" option on Process reply dropdown
        And the response has the "Excusal" option on Process reply dropdown
        And the response has the "Disqualified" option on Process reply dropdown
        And the response has the "Send to…" option on Process reply dropdown
        And the response has the "Awaiting information" option on Process reply dropdown

    @JDB-39 @deferral @AC9
    Scenario: Upon selecting the deferral ‘Process reply’ option, a modal window appears with the accept deferral content
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the modal title should be "Deferral"

    @JDB-39 @deferral @AC12
    Scenario: User has two options - ‘Refuse deferral’ or ‘Accept deferral’
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the deferral modal should have the Refuse deferral option
        And the deferral modal should have the Accept deferral option

    @JDB-39 @deferral @AC13
    Scenario: The ‘Mark as completed’ green button is disabled until all fields are populated
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the deferral modal has the Mark as completed button disabled

    @JDB-39 @deferral @AC14
    Scenario: Contains a text ‘Cancel’ link that cancels any actions taken within the modal window and returns user back to the summons response
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the deferral modal has the cancel link

      When I click the deferral modal cancel link
        Then the modal should not be on screen

    @JDB-39 @deferral @refuse @AC15 @AC16
    Scenario: Deferral refuse drop down contains the expected reasons currently listed on Juror
      When I select the "Deferral" Process reply option
        Then the modal should be on screen

      When I choose to refuse the deferral

      Then the deferral modal has the "DECEASED" reason for the deferral
        And the deferral modal has the "RECENTLY SERVED" reason for the deferral
        And the deferral modal has the "THE FORCES" reason for the deferral
        And the deferral modal has the "POSTPONEMENT OF SERVICE" reason for the deferral
        And the deferral modal has the "RELIGIOUS REASONS" reason for the deferral
        And the deferral modal has the "CHILD CARE" reason for the deferral
        And the deferral modal has the "WORK RELATED" reason for the deferral
        And the deferral modal has the "MEDICAL" reason for the deferral
        And the deferral modal has the "TRAVELLING DIFFICULTIES" reason for the deferral
        And the deferral modal has the "MOVED FROM AREA" reason for the deferral
        And the deferral modal has the "OTHER" reason for the deferral
        And the deferral modal has the "STUDENT" reason for the deferral
        And the deferral modal has the "LANGUAGE DIFFICULTIES" reason for the deferral
        And the deferral modal has the "HOLIDAY" reason for the deferral
        And the deferral modal has the "CARER" reason for the deferral
        And the deferral modal has the "WORKS IN ADMINISTRATION OF JUSTICE" reason for the deferral
        And the deferral modal has the "MENTAL HEALTH" reason for the deferral
        And the deferral modal has the "EXCUSE BY BUREAU, TOO MANY JURORS" reason for the deferral

    @JDB-39 @JDB-2487 @deferral @refuse @AC17 @AC18
    Scenario: When refusing the deferral, upon hitting the ‘Mark as completed’ button the reply is correctly updated
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the deferral modal has the Mark as completed button disabled

      When I choose to refuse the deferral
        And I choose the "RECENTLY SERVED" reason for the deferral

      Then the deferral modal has the Mark as completed button enabled

      When I mark the deferral as completed

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Responded" on the detail page

        And I check the "JUROR.POOL" table for "Y" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "S" within the "EXC_CODE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "samanthak" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "2" within the "STATUS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Z" within the "ACC_EXC" field for "PART_NO" "309092530"

        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "PDEF" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Deferral Denied - S" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "RESP" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Responded" AND "PART_NO" "309092530"

        And I check that "JUROR.DEF_DENIED" table has a result for "EXC_CODE" "S" AND "PART_NO" "309092530"

        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "CLOSED" within the "PROCESSING_STATUS" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "Y" within the "PROCESSING_COMPLETE" field for "JUROR_NUMBER" "309092530"

        # Check if data has been copied across correctly
        And I check the "JUROR.POOL" table for "Dr" within the "TITLE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Jon" within the "FNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Doey" within the "LNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "24/07/1985" within the "DOB" date field with format "DD/MM/YYYY" for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "5 Trail Street" within the "ADDRESS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Aberdeen" within the "ADDRESS2" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Scotland" within the "ADDRESS3" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "United Kingdom" within the "ADDRESS4" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "AB21 5RY" within the "ZIP" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(703)209-6994" within the "H_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(145)525-2391" within the "W_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "jon.doey@mystery.gov" within the "H_EMAIL" field for "PART_NO" "309092530"

        # Ensure can no longer edit
      When I switch to the Juror details tab
        Then the edit button for Juror details is not visible

      When I switch to the Eligibility tab
        Then the edit button for Eligibility is not visible

      When I switch to the Deferral or excusal tab
        Then the edit button for Deferral or excusal is not visible

      When I switch to the CJS Employee tab
        Then the edit button for CJS employee is not visible

      When I switch to the Reasonable adjustment tab
        Then the edit button for Reasonable adjustments is not visible

      # Perform last as we need to load the page to confirm
      When I go directly to the "/completed" page
        Then the entry for juror number "309092530" is within the completed list

    @JDB-39 @deferral @accept @AC24 @AC25
    Scenario: Deferral accept drop down contains the expected reasons currently listed on Juror
      When I select the "Deferral" Process reply option
        Then the modal should be on screen

      When I choose to accept the deferral

      Then the deferral modal has the "DECEASED" reason for the deferral
        And the deferral modal has the "RECENTLY SERVED" reason for the deferral
        And the deferral modal has the "THE FORCES" reason for the deferral
        And the deferral modal has the "POSTPONEMENT OF SERVICE" reason for the deferral
        And the deferral modal has the "RELIGIOUS REASONS" reason for the deferral
        And the deferral modal has the "CHILD CARE" reason for the deferral
        And the deferral modal has the "WORK RELATED" reason for the deferral
        And the deferral modal has the "MEDICAL" reason for the deferral
        And the deferral modal has the "TRAVELLING DIFFICULTIES" reason for the deferral
        And the deferral modal has the "MOVED FROM AREA" reason for the deferral
        And the deferral modal has the "OTHER" reason for the deferral
        And the deferral modal has the "STUDENT" reason for the deferral
        And the deferral modal has the "LANGUAGE DIFFICULTIES" reason for the deferral
        And the deferral modal has the "HOLIDAY" reason for the deferral
        And the deferral modal has the "CARER" reason for the deferral
        And the deferral modal has the "WORKS IN ADMINISTRATION OF JUSTICE" reason for the deferral
        And the deferral modal has the "MENTAL HEALTH" reason for the deferral
        And the deferral modal has the "EXCUSE BY BUREAU, TOO MANY JURORS" reason for the deferral

    @JDB-39 @JDB-2487 @deferral @accept @AC19 @AC20 @AC21 @AC22 @AC23 @AC25 @AC26
    Scenario: When accepting the deferral, upon hitting the ‘Mark as completed’ button the reply is correctly updated
      When I select the "Deferral" Process reply option

      Then the modal should be on screen
        And the deferral modal has the Mark as completed button disabled

      When I choose to accept the deferral
        And I click the deferral date trigger
        And I click the next date arrow
        And I click the next date arrow
        And I select the 10th day of the month

        And I choose the "RECENTLY SERVED" reason for the deferral

      Then the deferral modal has the Mark as completed button enabled

      When I mark the deferral as completed

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Deferred" on the detail page

        And I check the "JUROR.POOL" table for "Y" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for a date "4" months in the future within the "DEF_DATE" date field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for todays date within the "DATE_EXCUS" date field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "S" within the "EXC_CODE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "samanthak" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "7" within the "STATUS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "1" within the "NO_DEF_POS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "NULL" within the "NEXT_DATE" field for "PART_NO" "309092530"

        And I check the "JUROR.DEFER_DBF" table for a date "4" months in the future within the "DEFER_TO" date field for "PART_NO" "309092530"

        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "RESP" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Responded" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "PDEF" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Add defer - S" AND "PART_NO" "309092530"

        And I check that "JUROR.DEF_LETT" table has a result for "EXC_CODE" "S" AND "PART_NO" "309092530"

        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "CLOSED" within the "PROCESSING_STATUS" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "Y" within the "PROCESSING_COMPLETE" field for "JUROR_NUMBER" "309092530"

        # Check if data has been copied across correctly
        And I check the "JUROR.POOL" table for "Dr" within the "TITLE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Jon" within the "FNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Doey" within the "LNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "24/07/1985" within the "DOB" date field with format "DD/MM/YYYY" for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "5 Trail Street" within the "ADDRESS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Aberdeen" within the "ADDRESS2" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Scotland" within the "ADDRESS3" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "United Kingdom" within the "ADDRESS4" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "AB21 5RY" within the "ZIP" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(703)209-6994" within the "H_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(145)525-2391" within the "W_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "jon.doey@mystery.gov" within the "H_EMAIL" field for "PART_NO" "309092530"

        # Ensure can no longer edit
      When I switch to the Juror details tab
        Then the edit button for Juror details is not visible

      When I switch to the Eligibility tab
        Then the edit button for Eligibility is not visible

      When I switch to the Deferral or excusal tab
        Then the edit button for Deferral or excusal is not visible

      When I switch to the CJS Employee tab
        Then the edit button for CJS employee is not visible

      When I switch to the Reasonable adjustment tab
        Then the edit button for Reasonable adjustments is not visible

      # Perform last as we need to load the page to confirm
      When I go directly to the "/completed" page
        Then the entry for juror number "309092530" is within the completed list
