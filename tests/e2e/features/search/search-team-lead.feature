Feature: Team lead Search page

   As a Bureau team leader, I want to be able to search and view all digital summons replies received, so that I can reassign them

   Background:
    Given I truncate the database tables
      And I setup the db with the file named "data"
      And I add the "authentication" data
      And I add the "search" data

    When I navigate to the Search page
      Then I confirm I am on the Login page

    When I navigate to the login page
      And I login with "jcambell" and "password"
      Then I confirm I am on the Inbox page

    When I click the Search navigation tab
      Then I confirm I am on the Search page


    # Start Scenarios
    # -------------------------------------
    @JDB-1972 @filter
    Scenario: The search page shows the title "Search"
      Then the page title is "Search"

    @JDB-1972 @AC2 @AC5 @AC6 @filter
    Scenario Outline: The filters allow entry of the "<label>" search condition
      Then the search filters have the search button disabled
        And the search filters have the clear all button disabled
        And the search filters have a label for "<label>"
        And the search filters can enter "<value>" for the "<label>" search condition
        And the search filters have the search button enabled
        And the search filters have the clear all button enabled

      Examples:
      | label             | value     |
      | Juror number      | 123456789 |
      | Last name         | Smith     |
      | Postcode          | AB21 3RY  |
      | Pool number       | 555       |

    @JDB-1972 @AC2 @AC5 @AC6 @AC9 @AC10 @filter
    Scenario: The filters allow enabling the urgent option
      Then the search filters have the search button disabled
        And the search filters have the clear all button disabled

      When I expand the additional filters
        Then the search filters have a label for "Urgent"

      When I enable the Urgent filter
      Then the Urgent filter is enabled
        And the search filters have the search button enabled
        And the search filters have the clear all button enabled

    @JDB-1972 @AC2 @AC5 @AC6 @AC9 @AC10 @AC11 @filter
    Scenario Outline: The filters allow enabling the <status> status
      Then the search filters have the search button disabled
        And the search filters have the clear all button disabled

      When I expand the additional filters
        Then the search filters have a label for "<status>"

      When I enable the <status> filter
      Then the <status> filter is enabled
        And the search filters have the search button enabled
        And the search filters have the clear all button enabled

      Examples:
      | status                |
      | To do                 |
      | Awaiting juror        |
      | Awaiting translation  |
      | Awaiting court reply  |
      | Completed             |

    @JDB-1972 @AC5 @AC6 @AC7 @AC9 @AC10 @AC11 @AC12 @filter
    Scenario: The clear all button can be used to empty all search filters
      When I expand the additional filters
        And the search filters can enter "123456789" for the "Juror number" search condition
        And the search filters can enter "Smith" for the "Last name" search condition
        And the search filters can enter "AB21 3RY" for the "Postcode" search condition
        And the search filters can enter "555" for the "Pool number" search condition
        And I change the officer assigned filter to "Samantha Kirkwood"
        And I enable the Urgent filter
        And I enable the To do filter
        And I enable the Awaiting juror filter
        And I enable the Awaiting court reply filter
        And I enable the Awaiting translation filter
        And I enable the Completed filter
        And I click the clear all filters button

      Then I have "" for the Juror number search condition
        And I have "" for the Last name search condition
        And I have "" for the Postcode search condition
        And I have "" for the Pool number search condition
        And I have "" for the Officer assigned search condition
        And the Urgent filter is disabled
        And the To do filter is disabled
        And the Awaiting juror filter is disabled
        And the Awaiting court reply filter is disabled
        And the Awaiting translation filter is disabled
        And the Completed filter is disabled

    @JDB-1972 @AC8 @filter
    Scenario: The officer assigned field should have a dropdown of active staff members from which the team leader can pick a value
      When I change the officer assigned filter to "Samantha Kirkwood"
        And I change the officer assigned filter to "James Cambell"


    @JDB-1972 @AC2 @results
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
      | Pool number  | 456          | 2     | Exact match   |
      | Pool number  | 457          | 1     | Exact match   |
      | Pool number  | 55           | 0     | Partial match |
      | Pool number  | 45           | 0     | Partial match |

    @JDB-1972 @AC8 @results
    Scenario Outline: I can retrieve only responses that are assigned to "<officer>"
      When I change the officer assigned filter to "<officer>"
        And I click the search button

      Then the search results have finished loading
        And the search results contain "<count>" items

      Examples:
      | officer           | count |
      | Samantha Kirkwood | 3     |
      | James Cambell     | 1     |

    @JDB-1972 @AC9 @AC10 @AC11 @AC12 @results
    Scenario Outline: The filters allow searching for the <status> status
      Given I add a generated response with the juror number "112436689" and the status "AWAITING_CONTACT" for assignee "jcambell"
        And I add a generated response with the juror number "112436687" and the status "AWAITING_TRANSLATION" for assignee "jcambell"
        And I add a generated response with the juror number "112436686" and the status "AWAITING_COURT_REPLY" for assignee "jcambell"
        And I add a generated response with the juror number "112436685" and the status "CLOSED" for assignee "jcambell"

      When I expand the additional filters
        And I enable the <status> filter
        And I click the search button

      Examples:
      | status                  | count |
      | To do                   | 4     |
      | Awaiting juror          | 1     |
      | Awaiting translation    | 1     |
      | Awaiting court reply    | 1     |
      | Completed               | 1     |

    @JDB-1972 @AC2 @AC9 @AC10 @AC13 @results @ALWAYS
    Scenario: I can search for urgent responses
      Given I add a Super Urgent response with the status "TODO" and assignee "samanthak"
        And I add an Urgent response with the status "TODO" and assignee "samanthak"

      When I expand the additional filters
        Then the search filters have a label for "Urgent"

      When I enable the Urgent filter
        And I click the search button

      Then the search results have finished loading
        And the search results contain "3" items

    @JDB-1972 @AC14 @results
    Scenario: The list shows a maximum of 250 responses with no paging
      Given I generate "250" responses assigned to "samanthak"

      When I enter "AB21 3RY" into the Postcode search box
        And I click the search button

      Then the search results have finished loading
        And the search results contain "250" items
        And the search page shows the correct message when more than "250" results are returned

    @JDB-2641 @AC1
    Scenario: Send to only available to team lead
      And I enter "Blogs" into the Last name search box
      And I click the search button
      And the Multi send to button is visible

    @JDB-2641 @AC7.1.1
    Scenario: At the top of the pop up it should say "Send n responses to" where n is the number of selected items for the update
      When I enter "Rivera" into the Last name search box
      And I click the search button
      And I click the Select all link
      And I click the Multi send to button
      And the modal should be on screen
      And the modal title should be "Send 2 responses to…"

    @JDB-2641 @AC3
    Scenario: Urgents and Super Urgents should not be sent to the Backlog by any Team Lead
      When I enter "Blogs" into the Last name search box

      And I click the search button
      And I click the Select all link
      And I click the Multi send to button
      Then the modal should be on screen
      And the Assign to dropdown is visible
      And the "The backlog" assignee is not visible

    @JDB-2381 @AC2
    Scenario: Team-Lead should be able to search for all Auto-Processed Responses
      When I add a generated response with the juror number "444444444" and the status "CLOSED" for assignee "AUTO"
      And I change the officer assigned filter to "AUTO"
      And I click the search button
      And the search results contain "1" items

    @JDB-2381 @AC5 @AC6
    Scenario: Bureau Officer should not be able to search for all Auto-Processed Responses, but still see them as results
      When I add a generated response with the juror number "444444444" and the status "CLOSED" for assignee "AUTO"
      And I navigate to the login page
      And I login with "samanthak" and "password"
      Then I confirm I am on the Inbox page
      When I click the Search navigation tab
      Then I confirm I am on the Search page
      Then the officer assigned filter does not have "AUTO"

      And I enter "444444444" into the Juror number search box
      And I click the search button
      Then the search results contain "1" items
