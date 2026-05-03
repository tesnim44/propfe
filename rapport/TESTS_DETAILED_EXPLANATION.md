# IBlog Test Suite Detailed Explanation

## Important Clarification

As of **May 2, 2026**, the active PHPUnit suite in [phpunit.xml](/C:/xampp/htdocs/iblogLV/phpunit.xml) contains **84 executable tests**, not 76.

This is because:

- `phpunit.xml` includes `Unit`, `Integration`, `Performance`, and `Advanced` suites.
- `tests/Functional` exists in the repository, but it is **not included** in the active PHPUnit configuration.
- `tests/Performance` is configured, but there are currently no active performance test files.

So this document explains **every currently executed test** returned by:

```powershell
vendor\bin\phpunit.bat --list-tests
```

---

## 1. Active Test Suite Structure

### Unit

- `CommunityControllerCoverageTest`: 3 tests
- `ControllerCoverageTest`: 5 tests
- `RepositoryCoverageTest`: 5 tests

Total Unit tests: **13**

### Integration

- `AdminUserManagementTest`: 6 tests
- `ArticleWorkflowTest`: 9 tests
- `AuthenticationTest`: 9 tests
- `PaginationRequirementsTest`: 4 tests
- `SearchAndCommunityTest`: 9 tests

Total Integration tests: **37**

### Advanced

- `ArticleApiEdgeCaseTest`: 26 tests
- `SearchIndexEdgeCaseTest`: 8 tests

Total Advanced tests: **34**

### Grand Total

`13 + 37 + 34 = 84 tests`

---

## 2. Unit Tests

Unit tests focus on small architectural blocks and coverage-specific branches.

---

### File: `tests/Unit/CommunityControllerCoverageTest.php`

#### 1. `testResolveRequestUserIdCoversSessionEmailIdAndMismatchPaths`

**Purpose**

This test verifies how `resolveRequestUserId()` decides who the current user is.

**What it checks**

- email-based identity resolution works;
- numeric `userId` resolution works;
- `$_REQUEST['userId']` fallback works;
- invalid emails return `0`;
- unknown user IDs return `0`;
- conflicting `userId` and `userEmail` returns `0`;
- missing email records return `0`.

**Why it matters**

Community endpoints depend on this helper for identity safety.  
If it resolves the wrong user, membership and premium checks become unreliable.

---

#### 2. `testCommunityCreationListJoinLeaveAndMessagingActionsAreCovered`

**Purpose**

This test exercises the main community action handlers directly.

**What it checks**

- creating a community without login fails;
- free users cannot create premium-only communities;
- invalid community payload is rejected;
- premium users can create a valid community;
- listing all communities works;
- listing user communities works both empty and populated;
- joining a community validates the community ID;
- leaving a community validates the community ID;
- valid join and leave calls succeed;
- invalid message retrieval request fails;
- invalid send-message request fails;
- valid send-message request succeeds;
- valid message retrieval returns stored messages;
- membership check returns correct status;
- user-name resolution inside repository works.

**Why it matters**

This test acts like a mini end-to-end validation of the procedural community controller layer without needing the external HTTP route.

---

#### 3. `testCommunityThreadHelpersCoverInvalidAndSuccessFlows`

**Purpose**

This test verifies thread-related controller actions and their failure modes.

**What it checks**

- thread list rejects invalid requests;
- non-members cannot access threads;
- free users can join but still cannot create premium threads;
- empty titles are rejected;
- overlong titles are rejected;
- premium members can create a valid thread;
- thread listing returns created threads;
- invalid thread-message fetch requests fail;
- invalid thread-message posts fail;
- missing thread IDs are rejected;
- valid thread messages can be posted;
- valid thread messages can be listed;
- free users cannot delete premium threads;
- invalid delete requests fail;
- valid delete requests succeed;
- unknown router actions return HTTP 404.

**Why it matters**

This test protects the most complex controller in the codebase: `CommunityController.php`.

---

### File: `tests/Unit/ControllerCoverageTest.php`

#### 4. `testUserControllerReadAndSearchHelpersReturnExpectedRows`

**Purpose**

This test checks the procedural user controller helper functions.

**What it checks**

- `getAllUsers()` returns seeded users;
- `searchUsers()` returns the expected filtered user.

**Why it matters**

It confirms that the controller wrapper still points correctly to the repository/service architecture.

---

#### 5. `testUserControllerDeleteRemovesUser`

**Purpose**

This test verifies direct user creation and deletion through controller helpers.

**What it checks**

- `AddUser()` creates a new user;
- `getUserByEmail()` retrieves that user;
- `deleteUser()` removes the user;
- subsequent lookup returns `false`.

**Why it matters**

It proves the procedural compatibility layer for user CRUD still works.

---

#### 6. `testArticleControllerListingAndSearchHelpersWork`

**Purpose**

This test verifies the article helper functions in the controller.

**What it checks**

- listing all articles works;
- listing only published articles works;
- listing articles by author works;
- article search returns the expected article.

**Why it matters**

It validates the compatibility bridge for article reads and searches.

---

#### 7. `testArticleControllerDeleteMarksArticleAsDeleted`

**Purpose**

This test verifies article deletion behavior through the controller.

**What it checks**

- `deleteArticle()` succeeds;
- the deleted article disappears from public published results;
- `getArticleById()` returns `null` after deletion.

**Why it matters**

This confirms deletion is implemented as the expected soft-delete workflow.

---

#### 8. `testSavedArticleHelpersHandleDuplicateSaveAndLookup`

**Purpose**

This test verifies save/unsave helper functions.

**What it checks**

- an article can be saved;
- `isArticleSaved()` becomes true;
- saving the same article again is rejected;
- saved articles are returned by `getSavedArticlesByUser()`;
- `getSavedId()` returns the correct row;
- `unsaveArticle()` deletes the saved row;
- saved state becomes false again.

**Why it matters**

It protects one of the common user interactions in the app.

---

### File: `tests/Unit/RepositoryCoverageTest.php`

#### 9. `testArticleRepositoryCoversMissingBranchesAndAlternateSchemas`

**Purpose**

This test drives branch coverage in `ArticleRepository`.

**What it checks**

- article listing works even when no avatar source exists;
- author avatar falls back to an empty string when needed;
- updating a non-existent article returns `false`;
- profile-avatar fallback works when `user_profile` exists.

**Why it matters**

It validates schema-adaptive behavior, not just the happy path.

---

#### 10. `testSavedArticleRepositoryCoversAlternateSchemas`

**Purpose**

This test drives branch coverage in `SavedArticleRepository`.

**What it checks**

- author avatar is empty when no avatar source exists;
- author avatar comes from `user_profile` when available.

**Why it matters**

It ensures saved article queries behave correctly across schema variations.

---

#### 11. `testUserRepositoryCoversMissingUserAndSubscriptionFallbackBranches`

**Purpose**

This test targets specific failure and fallback branches in `UserRepository`.

**What it checks**

- authentication fails for a missing user;
- update fails for a missing user;
- upgrading a user to premium succeeds even when subscription insertion may fail;
- the user’s `plan` becomes `premium`;
- the user’s `isPremium` flag becomes `1`.

**Why it matters**

It protects the design decision that premium upgrade should still work even if subscription recording has a problem.

---

#### 12. `testUserRepositoryCoversAllPublicMethodsDirectly`

**Purpose**

This test directly exercises all public methods of `UserRepository`.

**What it checks**

- user creation works;
- listing all users works;
- searching users works;
- lookup by email works;
- successful authentication works;
- failed authentication on wrong password works;
- lookup by ID works;
- user update works and preserves correct state;
- premium upgrade inserts a subscription;
- delete works and the user becomes unreachable afterward.

**Why it matters**

This is the main completeness test for repository behavior and was important for reaching full method coverage.

---

#### 13. `testUserRepositoryCoversMysqlPremiumExpiryBranch`

**Purpose**

This test targets the MySQL-specific date expression branch in `upgradeToPremium()`.

**What it checks**

- the branch for MySQL driver detection is executed;
- the user still becomes premium;
- plan and premium flag update correctly.

**Why it matters**

Without this test, the MySQL-specific expiration expression would not be covered directly.

---

## 3. Integration Tests

Integration tests verify that multiple layers work together: controller, service, repository, database, and endpoint behavior.

---

### File: `tests/Integration/AdminUserManagementTest.php`

#### 14. `testGuestCannotAccessAdminApi`

Checks that unauthenticated users cannot use the admin API.

#### 15. `testAdminSigninReturnsAdminRedirect`

Checks that an admin can sign in successfully and receives the expected redirect or admin navigation state.

#### 16. `testAdminCanCreateUser`

Checks that an authenticated admin can create a new user through the admin endpoint.

#### 17. `testAdminCanUpdateUserRoleAndPlan`

Checks that an admin can update another user’s role and subscription plan.

#### 18. `testAdminCannotDeleteOwnAccount`

Checks that the admin API blocks self-deletion to prevent locking out the only admin user.

#### 19. `testAuthenticatedUserDirectorySearchRequiresSessionAndReturnsMatches`

Checks that user-directory search requires authentication and returns correct matching records once signed in.

---

### File: `tests/Integration/ArticleWorkflowTest.php`

#### 20. `testPublicListContainsPublishedArticlesButNotDrafts`

Checks that the public article list shows published articles only and hides drafts.

#### 21. `testAuthenticatedListIncludesOwnDrafts`

Checks that when the author is authenticated, their own drafts are included in the list.

#### 22. `testPublishingArticlePersistsData`

Checks that publishing an article through the endpoint really stores it and returns it in subsequent reads.

#### 23. `testSavingEmptyDraftIsRejected`

Checks that an invalid draft payload with missing content is rejected.

#### 24. `testUserCannotUpdateAnotherUsersArticle`

Checks authorization: one user must not be allowed to edit an article they do not own.

#### 25. `testUserCanUpdateOwnedArticle`

Checks the normal update flow for an author editing their own article.

#### 26. `testUserCanSaveAndUnsavePublishedArticle`

Checks the whole save/unsave workflow for a published article.

#### 27. `testCommentAddPersistsAndReturnsUpdatedCount`

Checks that adding a comment saves it correctly and updates the comment count returned by the API.

#### 28. `testMalformedCoverImagePayloadIsRejected`

Checks that invalid cover-image payloads are refused instead of being accepted silently.

---

### File: `tests/Integration/AuthenticationTest.php`

#### 29. `testGuestCannotFetchAuthenticatedProfile`

Checks that `me` or authenticated profile lookup is blocked for guests.

#### 30. `testSignupCreatesAccountAndStartsSession`

Checks that signup both creates the user and starts an authenticated session.

#### 31. `testSignupRejectsWeakPassword`

Checks that weak passwords fail validation during registration.

#### 32. `testSignupRejectsDuplicateEmail`

Checks that registration cannot reuse an existing email.

#### 33. `testSigninRejectsInvalidCredentials`

Checks that bad login credentials are rejected.

#### 34. `testForgotPasswordAcceptsExistingAccount`

Checks that the forgot-password flow accepts an existing user and produces the expected response.

#### 35. `testResetPasswordSucceedsWithValidToken`

Checks that a valid reset token permits a successful password reset.

#### 36. `testResetPasswordRejectsExpiredToken`

Checks that expired tokens are refused.

#### 37. `testUpgradeToPremiumChangesPlanAndCreatesSubscription`

Checks the premium upgrade flow end-to-end: the user plan changes and a subscription record is created.

---

### File: `tests/Integration/PaginationRequirementsTest.php`

#### 38. `testFirstPageNavigationReturnsFirstSliceAndNextFlag`

Checks that page 1 returns the first group of results and indicates that another page exists.

#### 39. `testLastPageNavigationReturnsPartialRemainingItems`

Checks that the last page returns only the remaining subset instead of overflowing.

#### 40. `testPageSizeVariationChangesReturnedCountAndTotalPages`

Checks that changing page size updates both the item count and the computed total pages.

#### 41. `testEmptySavedListReturnsEmptyPaginationPayload`

Checks that an empty saved-articles listing still returns a valid pagination structure.

---

### File: `tests/Integration/SearchAndCommunityTest.php`

#### 42. `testSearchReturnsMatchingArticleByKeyword`

Checks article search by keyword.

#### 43. `testSearchReturnsMatchingUserInPeopleMode`

Checks people-mode search for users.

#### 44. `testSearchReturnsNoResultsForUnknownKeyword`

Checks the empty-result behavior for unmatched search terms.

#### 45. `testSearchSafelyHandlesSpecialCharacters`

Checks that special characters do not break the search endpoint or produce unsafe behavior.

#### 46. `testJoinCommunitySucceedsAndRejoinDoesNotDuplicateMembership`

Checks that first join works and rejoining does not create duplicate membership records.

#### 47. `testNonMemberCannotAccessThreads`

Checks thread access control for non-members.

#### 48. `testFreeMemberCannotCreatePremiumThread`

Checks premium gating for thread creation.

#### 49. `testPremiumMemberCanCreateThreadAndPostMessage`

Checks the happy path where a premium member creates a thread and posts inside it.

#### 50. `testThreadTitleBoundaryValidationRejectsOverlongTitles`

Checks thread-title length validation.

---

## 4. Advanced Tests

Advanced tests target edge cases, API safety, serialization behavior, invalid inputs, and regression-prone logic.

---

### File: `tests/Advanced/ArticleApiEdgeCaseTest.php`

#### 51. `testArticleApiRejectsGetRequests`

Checks that the article API refuses unsupported GET requests and returns the proper method error.

#### 52. `testSavedListRequiresAuthentication`

Checks that the saved-articles listing endpoint requires sign-in.

#### 53. `testSavedListReturnsSavedArticlesWithPagination`

Checks saved-article listing format, pagination payload, and returned records.

#### 54. `testSavedListCanAuthenticateThroughAuthorEmailFallback`

Checks that saved-list lookup can still resolve identity through the author-email fallback path.

#### 55. `testSavedListRejectsUnknownAuthorEmailFallback`

Checks that unknown fallback email does not authenticate or expose saved data.

#### 56. `testSavedToggleRejectsUnknownArticle`

Checks that save toggling fails for a non-existent article.

#### 57. `testSavedToggleRejectsInvalidArticleId`

Checks that invalid article IDs are rejected before database logic proceeds.

#### 58. `testSavedToggleWithoutExplicitFlagAutoTogglesSavedState`

Checks automatic toggle behavior when the request does not explicitly say save or unsave.

#### 59. `testLikeToggleCreatesAndRemovesLike`

Checks that liking once creates a like and liking again removes it.

#### 60. `testLikeToggleRejectsUnknownArticle`

Checks that likes cannot be toggled on missing articles.

#### 61. `testLikeToggleRejectsInvalidArticleId`

Checks that invalid article IDs are rejected for likes.

#### 62. `testLikeToggleWithoutExplicitFlagAutoTogglesLikeState`

Checks automatic like-toggle behavior without an explicit flag.

#### 63. `testCommentAddRejectsMissingBody`

Checks that empty comments are refused.

#### 64. `testCommentAddRejectsUnknownArticle`

Checks that comments cannot be posted to a non-existent article.

#### 65. `testAuthenticatedListIncludesSerializedCommentsAndLikes`

Checks that the authenticated article list returns comments and likes in the expected serialized shape.

#### 66. `testDeleteOwnArticleSoftDeletesIt`

Checks that deleting your own article performs a soft delete correctly.

#### 67. `testDeleteRejectsUnknownArticle`

Checks that delete fails for a missing article.

#### 68. `testDeleteRejectsForeignArticle`

Checks authorization: a user cannot delete another user’s article.

#### 69. `testSavePublishedArticleRequiresTitleAndBody`

Checks that publishing requires both title and body.

#### 70. `testSaveSerializesTemplateLabelCoverAndHighQualityBody`

Checks that saving an article preserves and serializes extra properties such as template, label, cover, and body content properly.

#### 71. `testSaveAcceptsValidBase64CoverImage`

Checks that a valid Base64 cover image payload is accepted and processed.

#### 72. `testSaveNormalizesLegacyCoverPathsAndJpegExtension`

Checks normalization of older cover-image path formats and JPEG extension handling.

#### 73. `testListHandlesInvalidCreatedAtGracefully`

Checks resilience when article timestamp data is malformed.

#### 74. `testUpdateRejectsInvalidArticleId`

Checks that update requests fail fast on invalid article IDs.

#### 75. `testUpdateRejectsEmptyPublishedContent`

Checks that update cannot produce an invalid published article with empty required content.

#### 76. `testUnknownArticleActionIsRejected`

Checks that unsupported article API actions return an explicit error rather than falling through silently.

---

### File: `tests/Advanced/SearchIndexEdgeCaseTest.php`

#### 77. `testSearchRejectsGetRequests`

Checks that the search endpoint only accepts the intended request method.

#### 78. `testSearchRejectsTooShortQueries`

Checks minimum-length validation for search queries.

#### 79. `testSearchAllModeReturnsMixedRankingPayload`

Checks that “all” mode returns a mixed result payload with the expected ranking structure.

#### 80. `testSearchUsesExactMatchRankingForPeopleMode`

Checks that exact matches in people-mode are ranked correctly.

#### 81. `testArticlesModeDoesNotReturnUsersCollection`

Checks that article-only mode does not leak the users collection in the response.

#### 82. `testPeopleModeNormalizesLegacyProfileAssetPaths`

Checks that old profile asset paths are normalized in people-mode search results.

#### 83. `testPeopleModeNormalizesBackendProfileAssetPathAndDefaultPathPassThrough`

Checks path normalization for backend profile assets while preserving already-correct default paths.

#### 84. `testSearchReturnsEmptyPayloadWhenDatabaseConnectionIsUnavailable`

Checks graceful degradation when the search endpoint cannot reach the database.

---

## 5. Files Present But Not Active In PHPUnit

The repository also contains files in `tests/Functional`, such as:

- `tests/Functional/AuthenticationTest.php`
- `tests/Functional/ArticleWorkflowTest.php`
- `tests/Functional/SearchAndCommunityTest.php`
- `tests/Functional/AdminUserManagementTest.php`
- and others

These files look similar in purpose to the active integration or advanced tests, but **they are not currently executed** by `phpunit.xml`.

### Why that matters

If someone says “the suite has 76 tests” or references only one folder, that is no longer accurate for the current configuration.

The technically correct statement for the current repo state is:

- **84 active PHPUnit tests**
- **0 active performance tests**
- **Functional directory present but not included in the current active test suites**

---

## 6. What The Test Suite Covers Overall

The full active suite verifies:

- authentication and registration;
- admin user management;
- article creation, update, deletion, comments, likes, and saved state;
- pagination behavior;
- search behavior across article and people modes;
- community membership, messaging, and premium thread restrictions;
- repository edge branches and schema variations;
- controller compatibility wrappers;
- safe handling of invalid input and unsupported actions.

---

## 7. Final Summary

If you need to present the suite academically, the clean explanation is:

1. `Unit` tests validate isolated controllers and repositories.
2. `Integration` tests validate end-to-end feature workflows across multiple layers.
3. `Advanced` tests validate edge cases, regressions, invalid input, and serialization behavior.
4. The current executed suite contains **84 tests**, not 76.
