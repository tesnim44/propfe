# IBlog Functional Test Suite

## Test Data Assumptions

- `Guest`: no authenticated session.
- `Free User`: active non-admin account on `free` plan.
- `Premium User`: active non-admin account on `premium` plan.
- `Admin User`: active account with `isAdmin = 1`.
- `Other User`: active non-admin account different from the executing user.
- `Published Article`: article created by `Other User` with status `published`.
- `Own Draft`: draft article created by the executing user.
- `Community`: existing community with at least one topic and chat enabled.
- Pagination cases apply to any list view that implements paging, such as Users, Articles, Saved Articles, or Search Results.

## User Management

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| UM-01 | User Management | Guest is blocked from session/profile retrieval | Guest session | 1. Send `action=me` to `backend/view/components/auth/api-auth.php`. | Request returns `401` and message `Not authenticated.`; no user data is returned. | High |
| UM-02 | User Management | Guest is blocked from admin API access | Guest session | 1. Open `backend/view/components/admin/admin_api.php?action=ping`. | Request returns `403` and message indicating admin access is required. | High |
| UM-03 | User Management | Admin sign-in redirects to admin area | Valid admin credentials exist | 1. Open the sign-in modal.<br>2. Enter admin email and password.<br>3. Submit the form. | Login succeeds and response redirects to `backend/view/components/admin/admin.php`. | High |
| UM-04 | User Management | Admin creates a standard user | Admin session; unique email is available | 1. Open Admin > Users.<br>2. Click `Create user`.<br>3. Enter valid name, email, password, `free` plan, `isAdmin=off`.<br>4. Submit. | New user is created, appears in the Users table, and is stored as a non-admin free account. | High |
| UM-05 | User Management | Admin updates user role and plan | Admin session; target user exists | 1. Open Admin > Users.<br>2. Edit the target user.<br>3. Set plan to `premium` and `isAdmin=on`.<br>4. Save changes. | User record is updated successfully and reopens with `premium` plan and admin flag enabled. | High |
| UM-06 | User Management | Admin cannot delete own account | Admin session | 1. Open Admin > Users.<br>2. Try to delete the currently logged-in admin user. | Deletion is blocked and the system shows `Impossible de supprimer votre propre compte admin`; admin account remains active. | High |
| UM-07 | User Management | Free member is blocked from premium thread creation | Free User joined to a community | 1. Open a joined community chat.<br>2. Go to `Threads`.<br>3. Attempt to create a thread. | Thread is not created and the user sees the premium restriction flow or premium-required error. | High |
| UM-08 | User Management | Non-member cannot access community threads | Free User or Premium User not joined to the community | 1. Request community thread list for a community the user has not joined.<br>2. Attempt to open thread messages. | Access is denied and the system returns a membership-related error for both actions. | High |

## Core Features

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CF-01 | Core Features | Feed displays published articles only | Signed-in user; at least one published article and one draft exist | 1. Open the Home feed.<br>2. Review visible article cards. | Published articles are visible in the feed; draft-only articles are excluded from public feed results. | High |
| CF-02 | Core Features | User publishes a valid article | Signed-in user on Writer view | 1. Enter a title.<br>2. Enter article body content.<br>3. Click `Publish`. | Article is created successfully with status `published` and appears in the feed/My Articles. | High |
| CF-03 | Core Features | User saves a valid draft | Signed-in user on Writer view | 1. Enter a title only, or body only.<br>2. Click `Save Draft`. | Draft is saved successfully and appears in My Articles with status `draft`. | High |
| CF-04 | Core Features | Empty draft is rejected | Signed-in user on Writer view | 1. Leave title and body empty.<br>2. Click `Save Draft`. | Save is blocked and the user sees `Add a title or some content before saving a draft.` | High |
| CF-05 | Core Features | Author updates own article | Signed-in author owns an existing article | 1. Open My Articles.<br>2. Edit one owned article.<br>3. Change title or body.<br>4. Save changes. | Article is updated successfully and the revised content persists after refresh. | High |
| CF-06 | Core Features | User cannot update another user's article | Signed-in user; Published Article owned by Other User exists | 1. Send article update request using the other user's article ID. | Request is rejected with `403` and message `You can only edit your own articles.` | High |
| CF-07 | Core Features | Author deletes own article | Signed-in author owns an existing article | 1. Open My Articles.<br>2. Delete one owned article.<br>3. Refresh the view. | Article is deleted successfully and no longer appears in My Articles, feed, or saved lists. | High |
| CF-08 | Core Features | User saves and unsaves a published article | Signed-in user; Published Article exists | 1. Open a published article.<br>2. Click `Save`.<br>3. Open Saved Articles and confirm presence.<br>4. Click `Saved`/`Unsave`.<br>5. Reopen Saved Articles. | First action adds the article to Saved Articles; second action removes it and saved state is synchronized across views. | High |
| CF-09 | Core Features | User posts a comment on a published article | Signed-in user; Published Article exists | 1. Open the article reader.<br>2. Enter a non-empty comment.<br>3. Submit the comment.<br>4. Refresh the article. | Comment is added successfully, comment count increments, and the comment remains after reload. | High |
| CF-10 | Core Features | User updates own profile and data persists | Signed-in user on Profile view | 1. Open Profile.<br>2. Edit name, email, and bio.<br>3. Save changes.<br>4. Reload the profile. | Updated profile values are saved successfully and displayed again after reload/session sync. | High |

## Search and Filtering

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| SF-01 | Search and Filtering | Search screen shows empty guidance before a query | Search page is available | 1. Open Search.<br>2. Do not type any keyword. | Search page shows the default empty guidance prompting the user to start with a keyword. | Medium |
| SF-02 | Search and Filtering | Keyword search returns matching articles by title | At least one article title contains a unique keyword | 1. Open Search.<br>2. Enter the unique title keyword.<br>3. Execute search. | Matching article cards are returned and the expected article is visible in results. | High |
| SF-03 | Search and Filtering | Keyword search returns matching people by author name | At least one author name contains a unique keyword | 1. Open Search.<br>2. Enter the author keyword.<br>3. Execute search. | Matching user/profile result cards are returned for the expected author. | High |
| SF-04 | Search and Filtering | `Articles` tab excludes people results | Search query matches both articles and people | 1. Run a search with mixed matches.<br>2. Switch to the `Articles` tab. | Only article results remain visible; people/profile cards are excluded. | High |
| SF-05 | Search and Filtering | `People` tab excludes article results | Search query matches both articles and people | 1. Run a search with mixed matches.<br>2. Switch to the `People` tab. | Only people/profile results remain visible; article cards are excluded. | High |
| SF-06 | Search and Filtering | Admin user filter and text search work together | Admin session; user dataset contains premium and free users | 1. Open Admin > Users.<br>2. Apply the `Premium` filter.<br>3. Enter a user name/email search term.<br>4. Review the table. | Table shows only rows that satisfy both conditions: premium status and matching text query. | High |
| SF-07 | Search and Filtering | Community search matches name/topics/creator text | Communities view contains multiple communities | 1. Open Communities.<br>2. Search by community name, topic tag, or creator-related keyword.<br>3. Review the result set. | Only communities matching the query in name, description, or tags remain visible. | Medium |
| SF-08 | Search and Filtering | No-result search state is handled clearly | Search page is available; use a keyword with no matches | 1. Enter a guaranteed non-existing keyword.<br>2. Execute search. | Search returns no cards and displays the `No results` message without layout errors. | Medium |

## Transactions and Workflows

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TW-01 | Transactions and Workflows | Forgot-password request succeeds for an existing account | Existing user email is known | 1. Open `Forgot Password`.<br>2. Enter the registered email.<br>3. Submit the request. | Request succeeds and the UI confirms that a reset link was sent to the entered email. | High |
| TW-02 | Transactions and Workflows | Password reset succeeds with a valid token | Valid reset token exists for a user | 1. Open `reset-password.php` with valid `token` and `email`.<br>2. Enter a strong new password.<br>3. Submit the reset form.<br>4. Sign in with the new password. | Password reset succeeds, token is marked used, and the new password authenticates successfully. | High |
| TW-03 | Transactions and Workflows | Expired or reused reset token is rejected | Reset token exists but is expired or already used | 1. Open the reset page with the expired or reused token.<br>2. Enter a strong password.<br>3. Submit the form. | Reset is rejected with `410` or invalid/expired-token message; password remains unchanged. | High |
| TW-04 | Transactions and Workflows | Premium upgrade workflow completes successfully | Signed-in Free User | 1. Open the Premium flow.<br>2. Complete account/payment steps with valid data.<br>3. Confirm the order. | User plan becomes `premium`, subscription becomes active, and premium-only features become accessible. | High |
| TW-05 | Transactions and Workflows | Guest is routed into signup when starting a premium purchase | Guest session | 1. Click a premium-only CTA such as `Go Premium`.<br>2. Observe the first modal presented. | User is routed to the signup/authentication flow before premium purchase can continue. | Medium |
| TW-06 | Transactions and Workflows | Join-community workflow succeeds and opens chat | Signed-in user not yet joined to the target community | 1. Open Communities.<br>2. Click `Join Community` on a target community.<br>3. Wait for the action to complete. | Membership is created, member count increases by one, and the community chat opens. | High |
| TW-07 | Transactions and Workflows | Rejoining the same community does not duplicate membership | Signed-in user already joined to the target community | 1. Send another join request for the same community.<br>2. Refresh community data. | Membership remains single-instance, member count does not increment again, and the system reports the user as already joined. | High |
| TW-08 | Transactions and Workflows | Draft workflow recovers after interruption | Signed-in user; Writer and My Articles are available | 1. Create a draft and save it.<br>2. Leave the Writer view.<br>3. Reopen the same draft from My Articles.<br>4. Publish it. | Draft content is restored correctly, publish succeeds, and final status changes from `draft` to `published`. | High |

## Pagination

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| PG-01 | Pagination | First page loads default page size | Paginated view exists with more records than one page | 1. Open the paginated view.<br>2. Note the default page size and row count. | First page loads successfully and displays no more than the configured default page size. | Medium |
| PG-02 | Pagination | Next-page navigation loads the next record set | Same as PG-01 | 1. Open page 1.<br>2. Click `Next`. | Page 2 loads successfully and shows the next record set without duplicating page-1 rows. | Medium |
| PG-03 | Pagination | Previous-page navigation returns to the prior record set | User is on page 2 or later | 1. From page 2, click `Previous`. | User returns to the prior page and the record set matches the earlier page exactly. | Medium |
| PG-04 | Pagination | `Previous` is disabled on first page | User is on page 1 | 1. Open the first page.<br>2. Inspect pagination controls.<br>3. Attempt to click `Previous`. | `Previous` is disabled or inert, and the view stays on page 1. | Medium |
| PG-05 | Pagination | `Next` is disabled on last page | Dataset spans multiple pages | 1. Navigate to the final page.<br>2. Inspect pagination controls.<br>3. Attempt to click `Next`. | `Next` is disabled or inert, and the view stays on the last page. | Medium |
| PG-06 | Pagination | Changing page size refreshes the list correctly | Paginated view supports page-size selection | 1. Open the paginated view.<br>2. Change page size from the default to a larger size.<br>3. Review the record count and page index. | View refreshes with the selected page size, record count updates correctly, and page index resets or remains valid per design. | Medium |
| PG-07 | Pagination | Partial last page shows only remaining records | Dataset size is not an exact multiple of page size | 1. Navigate to the last page.<br>2. Count visible rows. | Last page displays only the remaining records and no empty filler rows or duplicates. | Medium |
| PG-08 | Pagination | Empty dataset handles pagination gracefully | Paginated view has zero records after setup/filtering | 1. Open the view with no records.<br>2. Inspect the grid and pager area. | Empty-state message is shown, no rows are rendered, and pagination controls are hidden or disabled. | Medium |

## Advanced Test Scenarios

| Test ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AT-01 | Advanced Test Scenarios | Signup rejects weak password | Signup page/modal is available | 1. Start account creation.<br>2. Enter a password missing one required rule.<br>3. Submit the form. | Signup is blocked and the password error explains the missing strength requirements. | High |
| AT-02 | Advanced Test Scenarios | Signup rejects duplicate email | Existing account email is known | 1. Start account creation.<br>2. Enter an email already registered.<br>3. Submit the form. | Account is not created and the user sees `This email is already registered.` or equivalent duplicate-email feedback. | High |
| AT-03 | Advanced Test Scenarios | Sign-in rejects invalid credentials | Existing email is known | 1. Open Sign In.<br>2. Enter valid email with wrong password.<br>3. Submit. | Login fails with `Incorrect email or password.` and no session is created. | High |
| AT-04 | Advanced Test Scenarios | Article publish rejects missing required fields | Signed-in user on Writer view | 1. Leave title empty or body empty.<br>2. Click `Publish`. | Publish is blocked and the user sees `Title and content are required.` | High |
| AT-05 | Advanced Test Scenarios | Invalid article ID is rejected for write actions | Signed-in user | 1. Send article `update`, `delete`, or `saved_toggle` request with `articleId`/`id=0` or non-existing value. | Request fails with a validation or not-found error; no data is modified. | High |
| AT-06 | Advanced Test Scenarios | Invalid cover-image payload is rejected | Signed-in user on Writer view or API client | 1. Submit an article save/update request with malformed cover-image data. | Request is rejected with `Invalid cover image data.` or a save-media error; article data is not corrupted. | Medium |
| AT-07 | Advanced Test Scenarios | Overlong thread title is rejected | Premium User joined to a community | 1. Open community threads.<br>2. Enter a title longer than the allowed limit.<br>3. Submit thread creation. | Thread is not created and the system returns `Thread title is too long.` | Medium |
| AT-08 | Advanced Test Scenarios | Search safely handles special characters and unexpected input | Search page is available | 1. Enter special characters or mixed punctuation such as `"'<>%__@@`.<br>2. Execute search.<br>3. Observe results and errors. | Search completes without crashing, without broken layout, and without exposing server errors or unsafe rendering. | Medium |
