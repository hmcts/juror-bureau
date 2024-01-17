Feature: assign response

  As a Bureau Officer, I want to send a reply to a colleague (eg. Team Lead) for them to perform an action or review, so that one of us can complete the summons reply

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
    When I navigate to the Details page for response "509092530"
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    When I click the entry for juror number "509092530"
      Then the modal should not be on screen


    # Start Scenarios
    # -------------------------------------
    @JDB-2488 @assign @AC5 @AC6
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

    @JDB-2488 @assign @AC5 @AC7
    Scenario: The ‘Process reply’ drop down contains the correct options
      Then the response has the "Responded" option on Process reply dropdown
        And the response has the "Deferral" option on Process reply dropdown
        And the response has the "Excusal" option on Process reply dropdown
        And the response has the "Disqualified" option on Process reply dropdown
        And the response has the "Send to…" option on Process reply dropdown
        And the response has the "Awaiting information" option on Process reply dropdown

    @JDB-2488 @assign @AC9
    Scenario: Upon selecting the Send Send to… ‘Process reply’ option, a modal window appears with the send to content
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the modal title should be "Send to…"

    @JDB-2488 @assign @AC12
    Scenario: A Bureau Officer may only be able to send replies that are assigned to them
      When I go directly to the "/" page
        And I login with "samanthak" and "password"

      Then I confirm I am on the Inbox page

      # Assigned to self
      When I go directly to the "/response/309092530" page
        Then the response has the "Send to…" option on Process reply dropdown

      # Assigned to other user
      When I go directly to the "/response/509092530" page
        Then the response does not have the "Send to…" option on Process reply dropdown

      # Assigned to nobody
      When I go directly to the "/response/123251234" page
        Then the response does not have the "Send to…" option on Process reply dropdown


    @JDB-2488 @assign @AC13
    Scenario: A Team Leader can view and send any summons response regardless of the allocated Officer
      # Assigned to other user
      When I go directly to the "/response/309092530" page
        Then the response has the "Send to…" option on Process reply dropdown

      # Assigned to self
      When I go directly to the "/response/509092530" page
        Then the response has the "Send to…" option on Process reply dropdown

      # Assigned to nobody
      When I go directly to the "/response/123251234" page
        Then the response has the "Send to…" option on Process reply dropdown

    @JDB-2488 @assign @AC14 @teamlead
    Scenario: As a team leader I have a drop down of recipients and the backlog
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the modal title should be "Send to…"
        And the modal has the "The backlog" option on Staff dropdown
        And the modal has the "James Cambell" option on Staff dropdown
        And the modal has the "Molly Smith" option on Staff dropdown
        And the modal has the "Samantha Kirkwood" option on Staff dropdown

    @JDB-2488 @assign @AC14 @officer
    Scenario: As a bureau officer I have a drop down of recipients and no backlog
      When I go directly to the "/" page
        And I login with "samanthak" and "password"

      Then I confirm I am on the Inbox page

      When I go directly to the "/response/309092530" page
        And I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the modal title should be "Send to…"
        And the modal does not have the "The backlog" option on Staff dropdown
        And the modal has the "James Cambell" option on Staff dropdown
        And the modal has the "Molly Smith" option on Staff dropdown
        And the modal has the "Samantha Kirkwood" option on Staff dropdown

    @JDB-2488 @assign @AC15
    Scenario: Contains a text ‘Cancel’ link that cancels any actions taken within the modal window and returns user back to the summons response
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the Send to modal has the cancel link

      When I click the Send to modal cancel link
        Then the modal should not be on screen

    @JDB-2488 @assign @AC16
    Scenario: ‘Send’ button is disabled until a selection from the drop down is made
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the Send to modal has the Send button disabled

    @JDB-2488 @assign @AC17
    Scenario Outline: ‘Send’ button becomes active when selection is made
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the Send to modal has the Send button disabled

      When I select "<option>" as the send to target
        Then the Send to modal has the Send button enabled

      Examples:
      | option            |
      | The backlog       |
      | James Cambell     |
      | Molly Smith       |
      | Samantha Kirkwood |

    @ALWAYS @JDB-2488 @assign @AC18 @AC20
    Scenario: Sending a response to The backlog correctly updates the database
      When I go directly to the "/response/309092530" page
        And I select the "Send to…" Process reply option

      Then the modal should be on screen

      When I select "The backlog" as the send to target
        Then the Send to modal has the Send button enabled

      When I send the response to the new assignee

      # Check DB
      Then the modal should not be on screen
        And I confirm I am on the Inbox page
        And I check the "JUROR.POOL" table for "N" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "1" within the "STATUS" field for "PART_NO" "309092530"

        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "TODO" within the "PROCESSING_STATUS" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "N" within the "PROCESSING_COMPLETE" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "309092530"

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

      # Check response
      When I go directly to the "/response/309092530" page

      Then the response status is "To do"
        And the record status is "Summoned" on the detail page

    @JDB-2488 @assign @AC19 @AC20
    Scenario Outline: Sending a response to <option> correctly updates the database
      When I go directly to the "/response/309092530" page
        And I select the "Send to…" Process reply option

      Then the modal should be on screen

      When I select "<option>" as the send to target
        Then the Send to modal has the Send button enabled

      When I send the response to the new assignee


      # Check DB
      Then the modal should not be on screen
        And I confirm I am on the Inbox page
        And I check the "JUROR.POOL" table for "N" within the "RESPONDED" field for "PART_NO" "309092530"
        And I check the "JUROR.POOL" table for "1" within the "STATUS" field for "PART_NO" "309092530"

        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "TODO" within the "PROCESSING_STATUS" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "N" within the "PROCESSING_COMPLETE" field for "JUROR_NUMBER" "309092530"
        And I check the "JUROR_DIGITAL.JUROR_RESPONSE" table for "<username>" within the "STAFF_LOGIN" field for "JUROR_NUMBER" "309092530"

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

      # Log in as given user and verify appears on their list
      When I go directly to the "/" page
        And I login with "<username>" and "password"

      Then I confirm I am on the Inbox page
        And the entry for juror number "309092530" is within the inbox list

      @ALWAYS
      Examples:
      | option            | username  |
      | Samantha Kirkwood | samanthak |

      Examples:
      | option            | username  |
      | James Cambell     | jcambell  |

    @JDB-2641 @AC4
    Scenario Outline: Responses with a status of <status> should not be sent to the Backlog by any Officer or Team Lead
      When I go directly to the "/response/<response>" page
      Then the response has the "Send to…" option on Process reply dropdown
      When I select the "Send to…" Process reply option

      Then the modal should be on screen
        And the modal title should be "Send to…"
        And the modal does not have the "The backlog" option on Staff dropdown
        And the modal has the "James Cambell" option on Staff dropdown
        And the modal has the "Molly Smith" option on Staff dropdown
        And the modal has the "Samantha Kirkwood" option on Staff dropdown

      Examples:
      | response  | status               |
      | 223456789 | Awaiting juror       |
      | 323456789 | Awaiting translation |

      | 423456789 | Awaiting court reply |

    @JDB-2801
    Scenario: Backlog option not available for (urgent, super urgent and awaiting_) multi select
      Given I navigate to the Search page
	      And I enter "555" into the Pool number search box
        And I click the search button
      When I click the checkbox for Juror number "423456789"
        And I click the checkbox for Juror number "323456789"
	      And I click the Multi send to button
      Then the modal should be on screen
        And the modal title should be "Send 2 responses to…"
        And the modal does not have the "The backlog" option on Staff dropdown
        And the modal has the "James Cambell" option on Staff dropdown
        And the modal has the "Molly Smith" option on Staff dropdown
        And the modal has the "Samantha Kirkwood" option on Staff dropdown
      When I click the Send to modal cancel link
        Then the modal should not be on screen
