Feature: Authentication

  Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data

    When I navigate to the login page
      Then I confirm I am on the Login page


    # Start Scenarios
    # -------------------------------------
    @ALWAYS
    Scenario: I log in with the correct details
      When I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    Scenario: I log in with valid credentials for which log on has not been enabled
      When I login with "johnsmith" and "password"

      Then I confirm I am on the Login page
        And login feedback for User ID is "User is not enabled"
        And login feedback for Password is "User is not enabled"

    @ALWAYS
    Scenario: I log in with an incorrect username and password combination
      When I login with "sam22" and "password"

      Then I confirm I am on the Login page
        And login feedback for User ID is "User not found"
        And login feedback for Password is "User not found"

    Scenario: I log in with valid credentials for which the password has expired
      When I login with "msmith" and "password"

      Then I confirm I am on the Login page
        And login feedback for User ID is "Your password has expired. Please use the facility in the Juror application to specify a new one"
        And login feedback for Password is "Your password has expired. Please use the facility in the Juror application to specify a new one"

    Scenario: I enter the incorrect password 3 times and my account becomes disabled
      When I login with "samanthak" and "idk"
        Then I confirm I am on the Login page
        And login feedback for User ID is "User not found"

      When I login with "samanthak" and "idk"
        Then I confirm I am on the Login page
        And login feedback for User ID is "User not found"

      When I login with "samanthak" and "idk"
        Then I confirm I am on the Login page
        And login feedback for User ID is "User not found"

      When I login with "samanthak" and "idk"
        Then I confirm I am on the Login page
        And login feedback for User ID is "User is not enabled"

    Scenario: I log in with valid credentials and the date last used is updated with the current date
      When I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page
        And the column last_used in the password table should contain the current date

    @JDB-1435
    Scenario: I log in with valid credentials and I am notified that my password is due to expire
      When I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page
        And the password expiry notice should show "10" days
