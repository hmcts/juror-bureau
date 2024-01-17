Feature: Update Juror Response to complete

  As a Bureau Officer, I want to accept that a juror has responded to their summons and mark their response as complete so that they can be processed in Juror

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
    @JDB-2487 @completed @AC5 @AC6
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

    @JDB-2487 @completed @AC5 @AC7
    Scenario: The ‘Process reply’ drop down contains the correct options
      Then the response has the "Responded" option on Process reply dropdown
        And the response has the "Deferral" option on Process reply dropdown
        And the response has the "Excusal" option on Process reply dropdown
        And the response has the "Disqualified" option on Process reply dropdown
        And the response has the "Send to…" option on Process reply dropdown
        And the response has the "Awaiting information" option on Process reply dropdown

    @JDB-2487 @completed @AC9
    Scenario: Upon selecting the Responded ‘Process reply’ option, a modal window appears with the mark as responded content
      When I select the "Responded" Process reply option

      Then the modal should be on screen
        And the modal title should be "Responded"

    @JDB-2487 @completed @AC12
    Scenario: Contains one check box for officer to select to accept a straight through response
      When I select the "Responded" Process reply option

      Then the modal should be on screen
        And the Responded modal has the Accept juror as responded option

    @JDB-2487 @completed @AC13
    Scenario: The ‘Mark as completed’ green button is disabled until the check box is checked
      When I select the "Responded" Process reply option

      Then the modal should be on screen
        And the Responded modal has the Mark as completed button disabled

    @JDB-2487 @completed @AC14
    Scenario: Contains a text ‘Cancel’ link that cancels any actions taken within the modal window and returns user back to the summons response
      When I select the "Responded" Process reply option

      Then the modal should be on screen
        And the Responded modal has the cancel link

      When I click the Responded modal cancel link
        Then the modal should not be on screen

    @JDB-2487 @completed @AC15
    Scenario: Upon checking the ‘Accept juror as responded’ box, the ‘Mark as completed’ button becomes active
      When I select the "Responded" Process reply option
        Then the modal should be on screen

      When I accept the juror as responded
        And the Responded modal has the Mark as completed button enabled

    @ALWAYS @JDB-2487 @JDB-2265 @completed @AC16
    Scenario: Upon hitting the ‘Mark as completed’ button: the record is correctly updated
      When I select the "Responded" Process reply option
        Then the modal should be on screen

      When I accept the juror as responded
        And I click the Mark as completed button

      Then the modal should not be on screen
        And the response status is "Completed"
        And the response does not have the Process reply dropdown
        And the record status is "Responded" on the detail page

        # Check if Disqualification database changes have been made
        And I check the "JUROR.POOL" table for "Y" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "samanthak" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "2" within the "STATUS" field for "PART_NO" "309092530"

        And I check that "JUROR.PART_HIST" table has a result for "HISTORY_CODE" "RESP" AND "PART_NO" "309092530"
        And I check that "JUROR.PART_HIST" table has a result for "OTHER_INFORMATION" "Responded" AND "PART_NO" "309092530"

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

    @JDB-2487
    Scenario: Ensure modal works on the Log tab
      When I switch to the Log tab
        Then the modal should not be on screen

      When I select the "Responded" Process reply option on the reply tab
        Then the modal should be on screen
