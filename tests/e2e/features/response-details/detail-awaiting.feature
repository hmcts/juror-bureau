Feature: Update Juror Response to awaiting information

  As a Bureau Officer, I want to mark a summons response as ‘Awaiting information’ so that it moves into a pending state for the time being

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "detail" data
      And I add a generated response with the juror number "223456789" and the status "AWAITING_CONTACT"
      And I add a generated response with the juror number "323456789" and the status "AWAITING_TRANSLATION"
      And I add a generated response with the juror number "423456789" and the status "AWAITING_COURT_REPLY"
      And I add a generated response with the juror number "523456789" and the status "CLOSED"
      And I add a generated unassigned response with the juror number "444444444" and the status "TODO"

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
    @JDB-2485 @awaiting @AC5 @AC6
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

    @JDB-2485 @awaiting @AC5 @AC7
    Scenario: The ‘Process reply’ drop down contains the correct options
      Then the response has the "Responded" option on Process reply dropdown
        And the response has the "Deferral" option on Process reply dropdown
        And the response has the "Excusal" option on Process reply dropdown
        And the response has the "Disqualified" option on Process reply dropdown
        And the response has the "Send to…" option on Process reply dropdown
        And the response has the "Awaiting information" option on Process reply dropdown

    @JDB-2485 @awaiting @AC9
    Scenario: Upon selecting the Awaiting information ‘Process reply’ option, a modal window appears with the Awaiting information content
      When I select the "Awaiting information" Process reply option

      Then the modal should be on screen
        And the modal title should be "Awaiting information"

    @JDB-2485 @awaiting @AC10
    Scenario: User has three options
      When I select the "Awaiting information" Process reply option

      Then the modal should be on screen
        And the "Awaiting juror" option is available when setting response as awaiting information
        And the "Awaiting court reply" option is available when setting response as awaiting information
        And the "Awaiting translation" option is available when setting response as awaiting information

    @JDB-2485 @awaiting @AC11
    Scenario: The ‘Update reply status’ green button is disabled until all fields are populated
      When I select the "Awaiting information" Process reply option

      Then the modal should be on screen
        And the Awaiting information modal has the Update reply status button disabled

    @JDB-2485 @awaiting @AC12
    Scenario: Contains the ‘Cancel’ link that cancels any actions taken within the modal window and returns user back to the summons response
      When I select the "Awaiting information" Process reply option

      Then the modal should be on screen
        And the Awaiting information modal has the cancel link

      When I click the Awaiting information modal cancel link
        Then the modal should not be on screen

    @JDB-2485 @awaiting
    Scenario: Upon checking a radio button, the ‘Update reply status’ button becomes active
      When I select the "Awaiting information" Process reply option
        Then the modal should be on screen

      When I select the "Awaiting juror" option for Awaiting information
        Then the Awaiting information modal has the Update reply status button enabled

    @JDB-2485 @awaiting @AC13 @AC1
    Scenario Outline: Upon hitting the ‘Update reply status’ button the record is correctly updated
      When I select the "Awaiting information" Process reply option
        Then the modal should be on screen

      When I select the "<status>" option for Awaiting information
        And I mark the awaiting information update as completed

      Then the modal should not be on screen
        And the response status is "<status>"
        And the record status is "Summoned" on the detail page


        And I check the "JUROR.POOL" table for "N" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "" within the "USER_EDTQ" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "1" within the "STATUS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table does not have "NULL" within the "NEXT_DATE" field for "PART_NO" "309092530"

        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<dbstatus>" within the "PROCESSING_STATUS" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "N" within the "PROCESSING_COMPLETE" field for "JUROR_NUMBER" "309092530"

        # Check data has not been copied across
        And I check the "JUROR.POOL" table for "Mr" within the "TITLE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "John" within the "FNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Doe" within the "LNAME" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "24/07/1984" within the "DOB" date field with format "DD/MM/YYYY" for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "4 Trail Street" within the "ADDRESS" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Scotland" within the "ADDRESS2" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "Aberdeen" within the "ADDRESS3" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "United Kingdom" within the "ADDRESS4" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "AB21 4RY" within the "ZIP" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(703)209-6993" within the "H_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "44(145)525-2390" within the "M_PHONE" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "john.doe@mystery.gov" within the "H_EMAIL" field for "PART_NO" "309092530"

      Examples:
      | status                | dbstatus              |
      | Awaiting court reply  | AWAITING_COURT_REPLY  |
      | Awaiting translation  | AWAITING_TRANSLATION  |

      @ALWAYS
      Examples:
      | status                | dbstatus              |
      | Awaiting juror        | AWAITING_CONTACT      |

    @JDB-2685
    Scenario: Changing status on an unassigned ticket should assign it to the logged in user
      When I go directly to the "/response/444444444" page
        Then the record status is "Summoned" on the detail page

      When I select the "Awaiting information" Process reply option
        Then the modal should be on screen

      When I select the "Awaiting juror" option for Awaiting information
        And I mark the awaiting information update as completed

      Then the modal should not be on screen
        And the response status is "Awaiting juror"
        And the record status is "Summoned" on the detail page
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "samanthak" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "444444444"
