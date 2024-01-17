Feature: Staff edit screen
  As a Bureau team Leader I need to be able to amend the details held for a Bureau officer so that they remain accurate

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    # @AC1 @AC2
    When I navigate to the Staff Edit page for "samanthak"
      Then I confirm I am on the Login page

    # @AC3
    When I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page
    When I navigate to the Staff Edit page for "samanthak"
      Then I confirm I am on the Inbox page

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    # @AC4
    When I click the Staff navigation tab
      Then I confirm I am on the Staff page

    When I click the row for the staff login "samanthak"
      Then I confirm I am on the Staff Edit page for "samanthak"

    # Start Scenarios
    # -------------------------------------
    @JDB-2044 @AC5
    Scenario: The screen displays the data fields populated with the current data for the selected staff member.
      Then the Staff Edit page has "Samantha Kirkwood" for the Name field
        And the Staff Edit page has the record as non Team leader
        And the Staff Edit page has the record as Active
        And the Staff Edit page has "London & Wales" selected for the Team dropdown

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

    @JDB-2044 @JDB-2695 @AC5 @bug
    Scenario: The screen displays the data fields populated with the current data for a team leader
      When I click the Staff navigation tab
        Then I confirm I am on the Staff page

      When I click the row for the staff login "jcambell"
        Then I confirm I am on the Staff Edit page for "jcambell"

      Then the Staff Edit page has "James Cambell" for the Name field
        And the Staff Edit page has the record as Team leader
        And the Staff Edit page has the record as Active
        And the Staff Edit page has "jcambell" for the Juror Application Username field
        And the Juror Application Username field is disabled
        And the Staff Edit page has "London & Wales" selected for the Team dropdown

    @JDB-2044 @JDB-2695 @AC5 @bug
    Scenario: The screen displays the data fields populated with the current data for an inactive staff member
      When I click the Staff navigation tab
        Then I confirm I am on the Staff page

      When I click the row for the staff login "johnsmith"
        Then I confirm I am on the Staff Edit page for "johnsmith"

      Then the Staff Edit page has "John Smith" for the Name field
        And the Staff Edit page has the record as non Team leader
        And the Staff Edit page has the record as Inactive
        And the Staff Edit page has "johnsmith" for the Juror Application Username field
        And the Juror Application Username field is disabled
        And the Staff Edit page has "South East, North East & North West" selected for the Team dropdown

    @JDB-2044 @AC6
    Scenario: A Save and Exit button and a Back link are available.
      Then the Staff Edit page has a Save and Exit button
        And the Staff Edit page has a Back link

    @JDB-2044 @AC7
    Scenario: A drop down must be provided on the Team field listing the available teams. Initially the 3 values will be 'London & Wales', 'South East, North East & North West' and 'Midlands & South West'
      Then the Staff Edit page has "London & Wales" as an option for the Team dropdown
        And the Staff Edit page has "South East, North East & North West" as an option for the Team dropdown
        And the Staff Edit page has "Midlands & South West" as an option for the Team dropdown

    @JDB-2044 @AC8.1
    Scenario: If the user presses the Save and Exit button a name must be entered with a maximum length of 30 characters.
      When I enter "" for the Name field on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

      Then the summary error for the name is "Please check the staff member name" on the Staff Edit screen
        And the detailed error for the name is "Please provide a name for the staff member" on the Staff Edit screen

    @JDB-2044 @AC8.5
    Scenario: If the user presses the Save and Exit button a team must be selected for the staff member from the drop down provided.
      When I select "- Select a team -" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

      Then the summary error for the team is "Please check the staff member team" on the Staff Edit screen
        And the detailed error for the team is "Please select a team for the staff member" on the Staff Edit screen

    @JDB-2044 @AC8.6
    Scenario Outline: If the user presses the Save and Exit button optionally up to 10 court codes can be allocated to the staff member. Each court code specified must be a 3 digit, positive, whole number.
      When I enter "abc" for the <court> Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

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

    @JDB-2044 @AC8.7
    Scenario Outline: If the user presses the Save and Exit button each court code entered should be unique for the staff member i.e. the user should not be able to enter the same court code more than once on a single staff member.
      When I enter "123" for the <court_1> Court field on the Staff Edit page
        And I enter "123" for the <court_2> Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

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

    @JDB-2044 @AC9 @ALWAYS
    Scenario: If the validation is successful when a user clicks on the Save and Exit button, then the details for the staff member must be updated on the database and the user returned to the Staff list screen where the data for the staff member will show the new values if applicable on the list.
      When I enter "Damantha Dirkwood" for the Name field on the Staff Edit page
        And I enable the Team leader checkbox for the Staff member
        And I disable the Active checkbox for the Staff member
        And I select "South East, North East & North West" as the Team on the Staff Edit page
        And I enter "130" for the 1st Court field on the Staff Edit page
        And I enter "131" for the 2nd Court field on the Staff Edit page
        And I enter "132" for the 3rd Court field on the Staff Edit page
        And I enter "133" for the 4th Court field on the Staff Edit page
        And I enter "134" for the 5th Court field on the Staff Edit page
        And I enter "135" for the 6th Court field on the Staff Edit page
        And I enter "136" for the 7th Court field on the Staff Edit page
        And I enter "137" for the 8th Court field on the Staff Edit page
        And I enter "138" for the 9th Court field on the Staff Edit page
        And I enter "139" for the 10th Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page
        And I wait for 1 seconds

      Then I confirm I am on the Staff page
        And I check the "JUROR_DIGITAL.STAFF" table for "Damantha Dirkwood" within the "name" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "1" within the "RANK" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "0" within the "ACTIVE" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "2" within the "TEAM_ID" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "130" within the "COURT_1" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "131" within the "COURT_2" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "132" within the "COURT_3" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "133" within the "COURT_4" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "134" within the "COURT_5" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "135" within the "COURT_6" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "136" within the "COURT_7" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "137" within the "COURT_8" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "138" within the "COURT_9" field for "LOGIN" "samanthak"
        And I check the "JUROR_DIGITAL.STAFF" table for "139" within the "COURT_10" field for "LOGIN" "samanthak"

    @JDB-2044 @AC11
    Scenario: If the user clicks on the Back link then they are returned to the Staff list screen without any of the validation being triggered and without the staff details being updated.
      When I click the back link on the Staff Edit page
      Then I confirm I am on the Staff page

    @JDB-2044
    Scenario Outline: Previously entered non court information is retained when errors are shown
      When I enter "<name>" for the Name field on the Staff Edit page
        And I <teamLeader> the Team leader checkbox for the Staff member
        And I <active> the Active checkbox for the Staff member
        And I select "<team>" as the Team on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

      Then I confirm I am on the Staff Edit page for "samanthak"
        And the Staff Edit page has "<name>" for the Name field
        And the Staff Edit page has the record as Inactive
        And the Staff Edit page has the record as Team leader
        And the Staff Edit page has "<team>" selected for the Team dropdown

      Examples:
      | name                | teamLeader  | active    | team              |
      | Damantha Dirkwood   | enable      | disable   | - Select a team - |
      |                     | enable      | disable   | London & Wales    |

    @JDB-2044 @JDB-2695
    Scenario: Previously entered court information is retained when errors are shown
      When I enter "" for the Name field on the Staff Edit page
        And I enter "130" for the 1st Court field on the Staff Edit page
        And I enter "131" for the 2nd Court field on the Staff Edit page
        And I enter "132" for the 3rd Court field on the Staff Edit page
        And I enter "133" for the 4th Court field on the Staff Edit page
        And I enter "134" for the 5th Court field on the Staff Edit page
        And I enter "135" for the 6th Court field on the Staff Edit page
        And I enter "136" for the 7th Court field on the Staff Edit page
        And I enter "137" for the 8th Court field on the Staff Edit page
        And I enter "138" for the 9th Court field on the Staff Edit page
        And I enter "139" for the 10th Court field on the Staff Edit page
        And I click the Save and Exit button on the Staff Edit page

      Then I confirm I am on the Staff Edit page for "samanthak"
        And the Staff Edit page has "130" for the 1st Court field
        And the Staff Edit page has "131" for the 2nd Court field
        And the Staff Edit page has "132" for the 3rd Court field
        And the Staff Edit page has "133" for the 4th Court field
        And the Staff Edit page has "134" for the 5th Court field
        And the Staff Edit page has "135" for the 6th Court field
        And the Staff Edit page has "136" for the 7th Court field
        And the Staff Edit page has "137" for the 8th Court field
        And the Staff Edit page has "138" for the 9th Court field
        And the Staff Edit page has "139" for the 10th Court field
