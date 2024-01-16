Feature: Excusal Juror Response

  As a Bureau Officer, I want to accept that a Juror is ineligible based on their responses, so that they can be disqualified

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
    @JDB-110 @excusal @AC5 @AC6
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

    @JDB-110 @excusal @AC5 @AC7
    Scenario: The ‘Process reply’ drop down contains the correct options
      Then the response has the "Responded" option on Process reply dropdown
        And the response has the "Deferral" option on Process reply dropdown
        And the response has the "Excusal" option on Process reply dropdown
        And the response has the "Disqualified" option on Process reply dropdown
        And the response has the "Send to…" option on Process reply dropdown
        And the response has the "Awaiting information" option on Process reply dropdown

    @JDB-110 @excusal @AC9
    Scenario: Upon selecting the excusal ‘Process reply’ option, a modal window appears with the accept excusal content
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the modal title should be "Excusal"

    @JDB-110 @excusal @AC12
    Scenario: User has two options - Refuse excusal or Accept excusal
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the excusal modal should have the Refuse excusal option
        And the excusal modal should have the Accept excusal option

    @JDB-110 @excusal @AC13
    Scenario: The ‘Mark as completed’ green button is disabled until all fields are populated
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the excusal modal has the Mark as completed button disabled

    @JDB-110 @excusal @AC14
    Scenario: Contains a text ‘Cancel’ link that cancels any actions taken within the modal window and returns user back to the summons response
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the excusal modal has the cancel link

      When I click the excusal modal cancel link
        Then the modal should not be on screen

    @JDB-110 @excusal @accept @refuse @AC15 @AC16 @AC19 @AC20
    Scenario: Drop down contains the expected reasons currently listed on Juror
      When I select the "Excusal" Process reply option
        Then the modal should be on screen

      When I choose to refuse the excusal

      Then the excusal modal has the "Select reason" reason for the excusal
        And the excusal modal has the "DECEASED" reason for the excusal
        And the excusal modal has the "RECENTLY SERVED" reason for the excusal
        And the excusal modal has the "THE FORCES" reason for the excusal
        And the excusal modal has the "POSTPONEMENT OF SERVICE" reason for the excusal
        And the excusal modal has the "RELIGIOUS REASONS" reason for the excusal
        And the excusal modal has the "CHILD CARE" reason for the excusal
        And the excusal modal has the "WORK RELATED" reason for the excusal
        And the excusal modal has the "MEDICAL" reason for the excusal
        And the excusal modal has the "TRAVELLING DIFFICULTIES" reason for the excusal
        And the excusal modal has the "MOVED FROM AREA" reason for the excusal
        And the excusal modal has the "OTHER" reason for the excusal
        And the excusal modal has the "STUDENT" reason for the excusal
        And the excusal modal has the "LANGUAGE DIFFICULTIES" reason for the excusal
        And the excusal modal has the "HOLIDAY" reason for the excusal
        And the excusal modal has the "CARER" reason for the excusal
        And the excusal modal has the "WORKS IN ADMINISTRATION OF JUSTICE" reason for the excusal
        And the excusal modal has the "MENTAL HEALTH" reason for the excusal
        And the excusal modal has the "EXCUSE BY BUREAU, TOO MANY JURORS" reason for the excusal

    @JDB-110 @JDB-2487 @excusal @refuse @AC17 @AC18 @AC21
    Scenario: When refusing the excusal, upon hitting the ‘Mark as completed’ button the reply is correctly updated
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the excusal modal has the Mark as completed button disabled

      When I choose to refuse the excusal
        And I choose the "RECENTLY SERVED" reason for the excusal

      Then the excusal modal has the Mark as completed button enabled

      When I mark the excusal as completed

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Responded" on the detail page

        And I check the "JUROR.POOL" table for "Y" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "S" within the "EXC_CODE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "samanthak" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "2" within the "STATUS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Y" within the "ACC_EXC" field for "PART_NO" "309092530"

        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "PEXC" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Refuse Excuse" AND "PART_NO" "309092530"

        And I check that "JUROR.EXC_DENIED_LETT" table has a result for "EXC_CODE" "S" AND "PART_NO" "309092530"

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

    @ALWAYS @JDB-110 @JDB-2487 @JDB-2544 @excusal @accept @AC17 @AC21 @AC22
    Scenario: When accepting the excusal, upon hitting the ‘Mark as completed’ button the reply is correctly updated
      When I select the "Excusal" Process reply option

      Then the modal should be on screen
        And the excusal modal has the Mark as completed button disabled

      When I choose to accept the excusal
        And I choose the "RECENTLY SERVED" reason for the excusal

      Then the excusal modal has the Mark as completed button enabled

      When I mark the excusal as completed

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Excused" on the detail page
        And the court date is "01/01/2099" on the detail page

        And I check the "JUROR.POOL" table for "Y" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "S" within the "EXC_CODE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "samanthak" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "5" within the "STATUS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "NULL" within the "NEXT_DATE" field for "PART_NO" "309092530"

        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "PEXC" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Add Excuse - S" AND "PART_NO" "309092530"

        And I check that "JUROR.EXC_LETT" table has a result for "EXC_CODE" "S" AND "PART_NO" "309092530"

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

    @JDB-110
    Scenario: Ensure modal works on the Log tab
      When I switch to the Log tab
        Then the modal should not be on screen

      When I select the "Excusal" Process reply option on the reply tab
        Then the modal should be on screen
