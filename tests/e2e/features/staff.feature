Feature: Staff list
  As a Bureau team leader I want to see a list of bureau staff so that I can select one for amendment

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    # @AC1 @AC2
    When I navigate to the Staff page
      Then I confirm I am on the Login page

    # @AC3
    When I navigate to the login page
      And I login with "samanthak" and "password"
      And I navigate to the Staff page
      Then I confirm I am on the Inbox page

    When I navigate to the login page
      And I login with "jcambell" and "password"

    # @AC4
    When I click the Staff navigation tab
      Then I confirm I am on the Staff page


    # Start Scenarios
    # -------------------------------------
    @JDB-2004 @AC5 @ALWAYS
    Scenario: The screen displays a list of all the staff members
      Then the staff list table is visible
        And the staff list table has "4" items

    @JDB-2004 @AC7
    Scenario Outline: For <name>; Active/Inactive indicator, name and team are displayed
      Then the staff list table has the name "<name>" for the staff login "<login>"
        And the staff list table has the team "<team>" for the staff login "<login>"
        And the staff list table has the state as "<state>" for the staff login "<login>"

      Examples:
      | login     | name              | team                                | state     |
      | samanthak | Samantha Kirkwood | London & Wales                      | active    |
      | johnsmith | John Smith        | South East, North East & North West | inactive  |
      | msmith    | Molly Smith       | South East, North East & North West | active    |
      | jcambell  | James Cambell     | London & Wales                      | active    |

    @JDB-2004 @AC5
    Scenario: Staff should be listed in alphabetical order within active and then within inactive.
      Then the 1st staff member is "James Cambell"
        And the 2nd staff member is "Molly Smith"
        And the 3rd staff member is "Samantha Kirkwood"
        And the 4th staff member is "John Smith"

    @JDB-2004 @AC6
    Scenario: An Add New Staff Member button is available
      Then the Add New Staff Member button is visible

    @JDB-2004 @AC8
    Scenario: If the user clicks on the Add New Staff Member button then they are taken to the Staff Edit screen where no data is displayed in the fields
      When I click the Add New Staff Member button
        Then I confirm I am on the Staff Create page

    @JDB-2004 @AC9
    Scenario Outline: If the user clicks on the staff member <login> then they are taken to the Staff Edit screen
      When I click the row for the staff login "<login>"
        Then I confirm I am on the Staff Edit page for "<login>"

      Examples:
      | login     |
      | samanthak |
      | johnsmith |
      | msmith    |
      | jcambell  |
