Feature: Bureau officer Search page

   As a Bureau officer, I want to be able to search and view all digital summons replies received, so that I can find one quickly when I need it

   Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "search" data

    # Ensure page cannot be accessed prior to login @AC1+2
    When I navigate to the Search page
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page

    When I click the Search navigation tab
      Then I confirm I am on the Search page


    # Start Scenarios
    # -------------------------------------
    @JDB-1971 @filter
    Scenario: The search page shows the title "Search"
      Then the page title is "Search"

    @JDB-1971 @AC3 @filter
    Scenario Outline: The filters allow entry of the "<label>" search condition
      Then the search filters have a label for "<label>"
        And the search filters can enter "<value>" for the "<label>" search condition

      Examples:
      | label         | value     |
      | Juror number  | 123456789 |
      | Last name     | Smith     |
      | Postcode      | AB21 3RY  |
      | Pool number   | 555       |

    @JDB-1972 @AC3 @filter @ALWAYS
    Scenario Outline: Team leader filter fields are not visible to non team leaders
      Then the search filters do not have a label for "<label>"

      Examples:
      | label             |
      | Officer assigned  |
      | Urgency           |
      | Status            |

    @JDB-1971 @AC4 @filter
    Scenario: The filters allow a disabled "Search" button by default
      Then the search filters have the search button
        And the search filters have the search button disabled

    @JDB-1971 @filter @AC4
    Scenario: When entering a search condition, the search button is enabled
      When I enter "123456789" into the Juror number search box
      Then the search filters have the search button enabled

    @JDB-1971 @AC4 @filter
    Scenario: When entering a search condition, the search button is disabled after clearing the condition
      When I enter "123456789" into the Juror number search box
      Then the search filters have the search button enabled

      When I clear the Juror number search box
      Then the search filters have the search button disabled

    @JDB-1971 @filter
    Scenario: The search page shows the correct text when no searches have taken place
      Then the search page shows the correct message prior to executing a search

    @JDB-1971 @filter
    Scenario: Searching for a Juror number will repopulate the search criteria on results being loaded
      When I enter "123456789" into the Juror number search box
        And I enter "Castillo" into the Last name search box
        And I enter "AB21 3RY" into the Postcode search box
        And I enter "555" into the Pool number search box
        And I click the search button

      Then I have "123456789" for the Juror number search condition
        And I have "Castillo" for the Last name search condition
        And I have "AB21 3RY" for the Postcode search condition
        And I have "555" for the Pool number search condition

    @JDB-1971 @AC6 @results
    Scenario Outline: The <field> filter can be used to narrow down search results
      When I enter "<value>" into the <field> search box
        And I click the search button

      Then the search results have finished loading
        And the search results contain "<count>" items

      Examples:
      | field         | value       | count | description   |
      | Juror number  | 123456789   | 1     | Exact match   |
      | Juror number  | 123456788   | 1     | Exact match   |
      | Juror number  | 123456787   | 1     | Exact match   |
      | Juror number  | 123         | 0     | Partial match |
      | Juror number  | 456         | 0     | Partial match |

      | Last name     | Castillo    | 1     | Exact match   |
      | Last name     | Cas         | 1     | Partial match |
      | Last name     | till        | 1     | Partial match |
      | Last name     | Rivera      | 2     | Exact match   |
      | Last name     | Riv         | 2     | Partial match |
      | Last name     | ver         | 2     | Partial match |

      | Postcode     | AB21 3RY     | 1     | Exact match   |
      | Postcode     | AB21         | 1     | Partial match |
      | Postcode     | 213R         | 1     | Partial match |
      | Postcode     | AB22 3RY     | 2     | Exact match   |
      | Postcode     | AB22         | 2     | Partial match |
      | Postcode     | 3R           | 4     | Partial match |

      | Pool number  | 555          | 1     | Exact match   |
      | Pool number  | 55           | 0     | Partial match |
      | Pool number  | 456          | 2     | Exact match   |
      | Pool number  | 45           | 0     | Partial match |

    @JDB-1971 @AC7 @results
    Scenario: The results list is displayed in date summons response received order with the oldest first.
      When I enter "AB2" into the Postcode search box
        And I click the search button

      Then the search results have finished loading
        And the search results contain "4" items
        And the 1st search result has Juror number "123456786"
        And the 2nd search result has Juror number "123456787"
        And the 3rd search result has Juror number "123456788"
        And the 4th search result has Juror number "123456789"

    @JDB-1971 @AC8 @results
    Scenario: The list shows a maximum of 100 responses with no paging
      Given I generate "110" responses assigned to "samanthak"

      When I enter "AB21 3RY" into the Postcode search box
        And I click the search button

      Then the search results have finished loading
        And the search results contain "100" items
        And the search page shows the correct message when more than "100" results are returned

    @ALWAYS @JDB-1971 @AC5 @AC6 @AC9 @results @JDB-2132 @bug
    Scenario: The search table should show details for each of the results
      When I enter "123456789" into the Juror number search box
        And I click the search button

      Then the search results have finished loading
        And the search results contain "1" items for "123456789"
        And the search result for Juror number "123456789" has a valid date
        And the search result for Juror number "123456789" has the Juror number "123456789"
        And the search result for Juror number "123456789" has the Name "Dr Jane Castillo"
        And the search result for Juror number "123456789" has the Postcode "AB21 3RY"
        And the search result for Juror number "123456789" has the Pool number "555"
        And the search result for Juror number "123456789" has the Officer "Samantha Kirkwood"
        And the search result for Juror number "123456789" has the Status "To do"

    @JDB-1971 @AC10 @results
    Scenario: The Super urgent symbol is shown on super urgent responses
      Given I add a Super Urgent response with the status "TODO" and assignee "samanthak"

      When I enter "123123123" into the Juror number search box
        And I click the search button

      Then the search results have finished loading
        And the search result for Juror number "123123123" contains the super urgent symbol

    @JDB-1971 @AC11 @results
    Scenario: The Urgent symbol is shown on urgent responses
      Given I add an Urgent response with the status "TODO" and assignee "samanthak"

      When I enter "321321321" into the Juror number search box
        And I click the search button

      Then the search result for Juror number "321321321" contains the urgent symbol

    @JDB-1971 @AC12 @results
    Scenario: The SLA overdue symbol is shown on overdue responses
      Given I add a SLA Overdue response with the status "TODO" and assignee "samanthak"

      When I enter "654987321" into the Juror number search box
        And I click the search button

      Then the search result for Juror number "654987321" contains the sla symbol

    @JDB-1971 @AC13 @results @ALWAYS
    Scenario: If a Bureau officer clicks on one of the summons responses in the list they should be taken to the Bureau details screen
      When I enter "AB21 3RY" into the Postcode search box
        And I click the search button

      When I click the response for Juror number "123456789"
      Then I confirm I am on the detail page

    @JDB-1971 @AC14 @results
    Scenario: Changing search criteria and clicking the search button loads new search results
      When I enter "Castillo" into the Last name search box
        And I click the search button
        Then the search results contain "1" items

      When I enter "Rivera" into the Last name search box
        And I click the search button
        Then the search results contain "2" items

    @JDB-1971 @AC15 @results
    Scenario: Searching for a non existant Juror number returns zero results
      When I enter "112233445" into the Juror number search box
        And I click the search button

      Then the search page shows the correct message when search returns no results

    @JDB-2267 @AC16
    Scenario: Search results for team lead still appear after selecting response then going back
      When I enter "123456789" into the Juror number search box
        And I click the search button
        And the search results contain "1" items

        Then I click the response for Juror number "123456789"
          And I click the back link on the detail page
          And I confirm I am on the Search page
          And the search results contain "1" items

    @JDB-2267 @AC13.2
    Scenario: Search results for bureau officer still appear after selecting response then going back
      When I enter "Rivera" into the Last name search box
        And I click the search button
        And the search results contain "2" items

        Then I click the response for Juror number "123456787"
          And I click the back link on the detail page
          And I confirm I am on the Search page
          And the search results contain "2" items

    @JDB-2641 @AC1
    Scenario: Send to only available to team lead
      And I enter "Blogs" into the Last name search box
      And I click the search button
      And the Multi send to button is not visible
