Feature: Staff create screen
  As a Bureau team leader I want to be able to create details for a bureau officer so that I can use them to allocate work

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    # @AC1 @AC2
    When I navigate to the Staff Create page
      Then I confirm I am on the Login page

    # @AC3
    When I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page
    When I navigate to the Staff Create page
      Then I confirm I am on the Inbox page

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    # @AC4
    When I click the Staff navigation tab
      Then I confirm I am on the Staff page

    When I click the Add New Staff Member button
      Then I confirm I am on the Staff Create page


    # Start Scenarios
    # -------------------------------------
    @JDB-2005 @AC5
    Scenario: The screen displays a set of empty data fields for the user to provide data for a new staff member.
      Then the Staff Edit page has "" for the Name field
        And the Staff Edit page has "" for the Juror Application Username field
        And the Staff Edit page has "" for the 1st Court field
        And the Staff Edit page has "" for the 2nd Court field
        And the Staff Edit page has "" for the 3rd Court field
        And the Staff Edit page has "" for the 4th Court field
        And the Staff Edit page has "" for the 5th Court field
        And the Staff Edit page has "" for the 6th Court field
        And the Staff Edit page has "" for the 7th Court field
        And the Staff Edit page has "" for the 8th Court field
        And the Staff Edit page has "" for the 9th Court field
        And the Staff Edit page has "" for the 10th Court field

    @JDB-2005 @AC6
    Scenario: A Save and Exit button and a Back link are available.
      Then the Staff Create page has a Save and Exit button
        And the Staff Edit page has a Back link

    @JDB-2005 @AC7
    Scenario: On entry the Team Leader radio button choice should be defaulted to No
      Then the Staff Edit page has the record as non Team leader

    @JDB-2005 @AC8
    Scenario: On entry the Active radio button choice should be defaulted to Yes
      Then the Staff Edit page has the record as Active

    @JDB-2005 @AC9
    Scenario: A dropdown must be provided on the Team field listing the available teams.
      Then the Staff Edit page has "- Select a team -" selected for the Team dropdown
        And the Staff Edit page has "London & Wales" as an option for the Team dropdown
        And the Staff Edit page has "South East, North East & North West" as an option for the Team dropdown
        And the Staff Edit page has "Midlands & South West" as an option for the Team dropdown

    @JDB-2005 @AC10 @AC10.1
    Scenario: If the user presses the Save and Exit button then a name must be entered with a maximum length of 30 characters.
      When I click the Save and Exit button on the Staff Create page

      Then the summary error for the name is "Please check the new staff member name" on the Staff Edit screen
        And the detailed error for the name is "Please provide a name for the new staff member" on the Staff Edit screen

    @JDB-2005 @AC10 @AC10.4.1
    Scenario: If the user presses the Save and Exit button then a Juror application user name must be provided
      When I click the Save and Exit button on the Staff Create page

      Then the summary error for the username is "Please check the new staff member Juror application user name" on the Staff Edit screen
        And the detailed error for the username is "Please enter the staff member Juror application user name" on the Staff Edit screen

    @JDB-2005 @AC10 @AC10.4.2
    Scenario: If the user presses the Save and Exit button then a Juror application user name must be unique across all staff, active or inactive
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enable the Team leader checkbox for the Staff member
        And I enter "jcambell" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then the summary error for the username is "Please check the new staff member Juror application user name" on the Staff Edit screen
        And the detailed error for the username is "This Juror username has already been allocated to James Cambell" on the Staff Edit screen

    @JDB-2005 @AC10 @AC10.5
    Scenario: If the user presses the Save and Exit button then a team must be selected for the staff member from the dropdown.
      When I click the Save and Exit button on the Staff Create page

      Then the summary error for the team is "Please check the new staff member team" on the Staff Edit screen
        And the detailed error for the team is "Please select a team for the staff member" on the Staff Edit screen

    @JDB-2005 @AC10 @AC10.6
    Scenario Outline: If the user presses the Save and Exit button then optionally up to 10 court codes can be allocated to the staff member. Each court code specified must be a 3 digit, positive, whole number.
      When I enter "abc" for the <court> Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then the summary error for the <court> Court is "Please check the <court> Court code" on the Staff Edit screen
        And the detailed error for the <court> Court is "Court code must be a 3 digit number" on the Staff Edit screen

      Examples:
      | court |
      | 1st   |
      | 2nd   |
      | 3rd   |
      | 4th   |
      | 5th   |
      | 6th   |
      | 7th   |
      | 8th   |
      | 9th   |
      | 10th  |

    @JDB-2005 @AC10 @AC10.7
    Scenario Outline: If the user presses the Save and Exit button then each court code entered should be unique for the staff member i.e. the user should not be able to enter the same court code more than once on a single staff member.
      When I enter "123" for the <court_1> Court field on the Staff Edit page
        And I enter "123" for the <court_2> Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then the summary error for the <court_1> Court is "Please check the <court_1> Court code" on the Staff Edit screen
        And the detailed error for the <court_1> Court is "You have entered the same court code more than once. Please remove the duplicate" on the Staff Edit screen
        And the summary error for the <court_2> Court is "Please check the <court_2> Court code" on the Staff Edit screen
        And the detailed error for the <court_2> Court is "You have entered the same court code more than once. Please remove the duplicate" on the Staff Edit screen

      Examples:
      | court_1 | court_2 | value |
      | 1st     | 2nd     | 123   |
      | 2nd     | 3rd     | 123   |
      | 3rd     | 4th     | 123   |
      | 4th     | 5th     | 123   |
      | 5th     | 6th     | 123   |
      | 6th     | 7th     | 123   |
      | 7th     | 8th     | 123   |
      | 8th     | 9th     | 123   |
      | 9th     | 10th    | 123   |

    @JDB-2005 @AC11 @ALWAYS
    Scenario: If the validation is successful when a user clicks on the Save and Exit button, then the details for the new staff member must be stored on the database and the user returned to the Staff list screen where the new staff member will now be included on the list.
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enter "jdeaves" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I enter "120" for the 1st Court field on the Staff Edit page
        And I enter "121" for the 2nd Court field on the Staff Edit page
        And I enter "122" for the 3rd Court field on the Staff Edit page
        And I enter "123" for the 4th Court field on the Staff Edit page
        And I enter "124" for the 5th Court field on the Staff Edit page
        And I enter "125" for the 6th Court field on the Staff Edit page
        And I enter "126" for the 7th Court field on the Staff Edit page
        And I enter "127" for the 8th Court field on the Staff Edit page
        And I enter "128" for the 9th Court field on the Staff Edit page
        And I enter "129" for the 10th Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff page
        And I check the "JUROR_DIGITAL.STAFF" table for "Jon Deaves" within the "name" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "0" within the "RANK" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "ACTIVE" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "TEAM_ID" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "120" within the "COURT_1" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "121" within the "COURT_2" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "122" within the "COURT_3" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "123" within the "COURT_4" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "124" within the "COURT_5" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "125" within the "COURT_6" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "126" within the "COURT_7" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "127" within the "COURT_8" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "128" within the "COURT_9" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "129" within the "COURT_10" field for "LOGIN" "jdeaves"

    @JDB-2005 @AC12
    Scenario: If the user clicks on the Back link then they are returned to the Staff list screen
      When I click the back link on the Staff Edit page
      Then I confirm I am on the Staff page

    @JDB-2005
    Scenario Outline: The new staff member can be attached to each of the available teams
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enter "jdeaves" for the Username field on the Staff Edit page
        And I select "<team>" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff page
        And I check the "JUROR_DIGITAL.STAFF" table for "Jon Deaves" within the "name" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "0" within the "RANK" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "ACTIVE" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "<id>" within the "TEAM_ID" field for "LOGIN" "jdeaves"

      Examples:
      | team                                | id |
      | London & Wales                      | 1  |
      | South East, North East & North West | 2  |
      | Midlands & South West               | 3  |

    @JDB-2005
    Scenario: If the user selects Team leader for the new staff member then this role is persisted in the database
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enable the Team leader checkbox for the Staff member
        And I enter "jdeaves" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff page
        And I check the "JUROR_DIGITAL.STAFF" table for "Jon Deaves" within the "name" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "RANK" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "ACTIVE" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "TEAM_ID" field for "LOGIN" "jdeaves"

    @JDB-2005
    Scenario: If the user selects Inactive for the new staff member then this status is persisted in the database
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I disable the Active checkbox for the Staff member
        And I enter "jdeaves" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff page
        And I check the "JUROR_DIGITAL.STAFF" table for "Jon Deaves" within the "name" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "0" within the "RANK" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "0" within the "ACTIVE" field for "LOGIN" "jdeaves"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "TEAM_ID" field for "LOGIN" "jdeaves"

    @JDB-2005
    Scenario Outline: Previously entered non court information is retained when errors are shown
      When I enter "<name>" for the Name field on the Staff Edit page
        And I <teamLeader> the Team leader checkbox for the Staff member
        And I <active> the Active checkbox for the Staff member
        And I enter "<username>" for the Username field on the Staff Edit page
        And I select "<team>" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff Create page
        And the Staff Edit page has "<name>" for the Name field
        And the Staff Edit page has the record as Inactive
        And the Staff Edit page has the record as Team leader
        And the Staff Edit page has "<username>" for the Juror Application Username field
        And the Staff Edit page has "<team>" selected for the Team dropdown

      Examples:
      | name        | teamLeader  | active    | username  | team              |
      | Jon Deaves  | enable      | disable   | jdeaves   | - Select a team - |
      |             | enable      | disable   | jdeaves   | London & Wales    |

    @JDB-2005
    Scenario: Previously entered court information is retained when errors are shown
      When I enter "120" for the 1st Court field on the Staff Edit page
        And I enter "121" for the 2nd Court field on the Staff Edit page
        And I enter "122" for the 3rd Court field on the Staff Edit page
        And I enter "123" for the 4th Court field on the Staff Edit page
        And I enter "124" for the 5th Court field on the Staff Edit page
        And I enter "125" for the 6th Court field on the Staff Edit page
        And I enter "126" for the 7th Court field on the Staff Edit page
        And I enter "127" for the 8th Court field on the Staff Edit page
        And I enter "128" for the 9th Court field on the Staff Edit page
        And I enter "129" for the 10th Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then I confirm I am on the Staff Create page
        And the Staff Edit page has "120" for the 1st Court field
        And the Staff Edit page has "121" for the 2nd Court field
        And the Staff Edit page has "122" for the 3rd Court field
        And the Staff Edit page has "123" for the 4th Court field
        And the Staff Edit page has "124" for the 5th Court field
        And the Staff Edit page has "125" for the 6th Court field
        And the Staff Edit page has "126" for the 7th Court field
        And the Staff Edit page has "127" for the 8th Court field
        And the Staff Edit page has "128" for the 9th Court field
        And the Staff Edit page has "129" for the 10th Court field


    @JDB-2153
    Scenario Outline: Previously entered non court information is retained when errors are shown
      When I enter "<name>" for the Name field on the Staff Edit page
        And I <teamLeader> the Team leader checkbox for the Staff member
        And I <active> the Active checkbox for the Staff member
        And I enter "<username>" for the Username field on the Staff Edit page
        And I select "<team>" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

    When I click the Add New Staff Member button
        Then the Staff Edit page has "" for the Name field
        And the Staff Edit page has "" for the Juror Application Username field
        And the Staff Edit page has "" for the 1st Court field
        And the Staff Edit page has "" for the 2nd Court field
        And the Staff Edit page has "" for the 3rd Court field
        And the Staff Edit page has "" for the 4th Court field
        And the Staff Edit page has "" for the 5th Court field
        And the Staff Edit page has "" for the 6th Court field
        And the Staff Edit page has "" for the 7th Court field
        And the Staff Edit page has "" for the 8th Court field
        And the Staff Edit page has "" for the 9th Court field
        And the Staff Edit page has "" for the 10th Court field

      Examples:
      | name        | teamLeader  | active    | username  | team              |
      | Jon Swanson | enable      | disable   | jswan     | London & Wales    |

    @JDB-2167 @bug
    Scenario: Previous staff member details are not displayed when returning to page after error
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enable the Team leader checkbox for the Staff member
        And I enter "samanthak" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then the summary error for the username is "Please check the new staff member Juror application user name" on the Staff Edit screen
        And the detailed error for the username is "This Juror username has already been allocated to Samantha Kirkwood" on the Staff Edit screen

      When I click the back link on the Staff Create page
        And I confirm I am on the Staff page
        And I click the Add New Staff Member button

      Then I confirm I am on the Staff Create page
        And the Staff Edit page has "" for the Name field
        And there is no error message details for the username on the Staff Edit screen


    @JDB-2167 @bug
    Scenario: Previous staff member details are not displayed when returning to page after saving
      When I enter "Jon Deaves" for the Name field on the Staff Edit page
        And I enable the Team leader checkbox for the Staff member
        And I enter "samanthak" for the Username field on the Staff Edit page
        And I select "London & Wales" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      Then the summary error for the username is "Please check the new staff member Juror application user name" on the Staff Edit screen
        And the detailed error for the username is "This Juror username has already been allocated to Samantha Kirkwood" on the Staff Edit screen

      When I enter "jdeaves" for the Username field on the Staff Edit page
        And I click the Save and Exit button on the Staff Create page

      When I click the Add New Staff Member button

      Then the Staff Edit page has "" for the Name field
        And there is no error message details for the username on the Staff Edit screen
