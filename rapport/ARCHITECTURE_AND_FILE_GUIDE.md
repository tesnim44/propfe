# IBlog Architecture And File Guide

## 1. Purpose Of This Document

This file explains:

- why each main file or folder exists
- what responsibility each part has
- which code lines are the main entry points
- how the new structure relates to the older `backend/...` paths
- where the article title styling lives

This guide focuses on the important application files, not generated artifacts such as every uploaded image, cached coverage file, or Composer vendor package.

## 2. Current Project Shape

The project now roughly follows this structure:

```text
config/
  config.php
public/
  index.php
  reset-password.php
  uploads/
src/
  Controller/
  Database/
  Repository/
  Service/
  Utils/
tests/
  Unit/
  Integration/
  Performance/
  Advanced/
  Support/
views/
  home.php
  reset-password.php
routes.php
base.sql
composer.json
phpunit.xml
```

There is still an important legacy layer:

```text
backend/
  config/
  controller/
  view/components/
```

That `backend/` tree is still used by the frontend and API entrypoints, but the canonical PHP logic now lives in `src/` and `config/`.

## 3. Canonical Code Vs Compatibility Code

### Canonical code

These are the files you should treat as the real source of truth:

- `config/config.php`
- `src/Utils/Env.php`
- `src/Database/Database.php`
- `src/Database/FakeDatabase.php`
- `src/Controller/*`
- `src/Repository/*`
- `src/Service/RouteRegistry.php`
- `views/*`
- `public/*`
- `routes.php`
- `base.sql`
- `tests/*`

### Compatibility code

These files exist so older paths keep working without breaking the app:

- `backend/config/database.php`
- `backend/config/env.php`
- `backend/controller/ArticleController.php`
- `backend/controller/SavedArticleController.php`
- `backend/controller/UserController.php`
- `backend/controller/CommunityController.php`

These files mainly `require_once` the canonical files under `src/` or `config/`.

### Generated or external folders

These are important operationally, but they are not core handwritten application architecture:

- `vendor/`
- `public/uploads/`
- `coverage/`
- `coverage-high/`
- `reports/`
- `tests/.phpunit.cache/`
- `tests/runtime/`

## 4. Root Files

### `index.php`

File: [index.php](index.php)

Necessity:
- The main entry point for the root URL.
- Defines the project root constant so views can resolve assets correctly.

Main lines:
- `4-6`: defines `IBLOG_PROJECT_ROOT`
- `8`: loads `views/home.php`

Functionality:
- Keeps the root URL simple.
- Delegates all actual page rendering to the `views/` layer.

### `reset-password.php`

File: [reset-password.php](reset-password.php)

Necessity:
- Separate entry point for the reset-password screen.

Main lines:
- `4-6`: defines `IBLOG_PROJECT_ROOT`
- `8`: loads `views/reset-password.php`

Functionality:
- Mirrors the main root entrypoint pattern.
- Keeps rendering logic out of the root file itself.

### `routes.php`

File: [routes.php](routes.php)

Necessity:
- Central exported route map for documentation, tooling, or future routing logic.

Main lines:
- `4`: loads `src/Service/RouteRegistry.php`
- `6`: returns `RouteRegistry::all()`

Functionality:
- Keeps route definitions in one place instead of scattering them across files.

### `base.sql`

File: [base.sql](base.sql)

Necessity:
- Defines the database schema required by the app.

Main lines:
- `1-14`: `users` table
- `16-32`: `article` table
- `34-40`: `savedarticle` table
- `42-52`: `comment` table
- `54-63`: `community` table
- `65-74`: `communitymember` table
- `76-84`: `community_message` table
- `86-97`: `subscription` table
- `99-107`: `password_resets` table
- `109-115`: `article_like` table
- `117-142`: thread tables

Functionality:
- Gives the app a reproducible schema baseline.
- Matches what the controllers expect to read and write.

### `composer.json`

File: [composer.json](composer.json)

Necessity:
- Defines PHP package metadata, PSR-4 autoloading, and test scripts.

Main lines:
- `5-9`: maps `IBlog\` to `src/`
- `10-12`: installs PHPUnit as the dev dependency
- `13-17`: maps `IBlog\Tests\` to `tests/`
- `18-22`: test scripts

Functionality:
- Lets Composer autoload classes in `src/`.
- Standardizes how tests are executed.

### `phpunit.xml`

File: [phpunit.xml](phpunit.xml)

Necessity:
- Central test runner configuration.

Main lines:
- `3-8`: bootstrap, cache, and execution settings
- `9-11`: coverage settings
- `12-25`: covered source files and excluded directories
- `27-39`: suite definitions

Functionality:
- Organizes the test suites into `Unit`, `Integration`, `Performance`, and `Advanced`.
- Limits coverage to the canonical/tested code paths instead of every wrapper file.

## 5. `config/`

### `config/config.php`

File: [config/config.php](config/config.php)

Necessity:
- The app-wide configuration source of truth.

Main lines:
- `4`: loads `src/Utils/Env.php`
- `6`: calls `loadEnvFile()`
- `8-34`: builds and caches the config array
- `23-31`: defines database configuration fields

Functionality:
- Reads environment-backed settings once.
- Exposes a single `iblogConfig()` function used by database bootstrap and other layers.
- Keeps environment lookups out of business logic files.

Why it matters:
- Without this file, database and app settings would be duplicated or hardcoded in many places.

## 6. `src/Utils/`

### `src/Utils/Env.php`

File: [src/Utils/Env.php](src/Utils/Env.php)

Necessity:
- Loads `.env` values without requiring a third-party library.

Main lines:
- `4-42`: `loadEnvFile()`
- `23-39`: parses `KEY=value` lines into `$_ENV` and `getenv()`
- `44-53`: `env()` helper with fallback default support

Functionality:
- Provides minimal environment-variable support.
- Ensures configuration can come from either `.env` or system environment variables.

Why it matters:
- This is the foundation below `config/config.php`.

## 7. `src/Database/`

### `src/Database/Database.php`

File: [src/Database/Database.php](src/Database/Database.php)

Necessity:
- Central database bootstrap and connection management.

Main lines:
- `4`: loads `config/config.php`
- `17-24`: `dbDriver()` identifies PDO driver
- `26-41`: `dbTableExists()`
- `43-64`: `dbColumnExists()`
- `76-90`: `databaseHosts()`
- `92-101`: `databaseNames()`
- `108-128`: `databaseReachable()` network reachability check
- `130-227`: `getDatabaseConnection()`
- `229-234`: initializes `$cnx` and captures startup failure

Functionality:
- Reads DB settings from `iblogConfig()`
- Supports DSN override when `DB_DSN` is provided
- Falls back across possible hosts and database names
- Uses MySQL only, with optional `DB_DSN` override support for connection testing
- Exposes helper functions used by controllers to check schema differences safely

Why it matters:
- Every controller depends on this file either directly or through a shim.
- It reduces failure noise by giving better diagnostics when MySQL is unavailable.

### `src/Database/FakeDatabase.php`

File: [src/Database/FakeDatabase.php](src/Database/FakeDatabase.php)

Necessity:
- In-memory fake data helper used by tests that do not need a real database connection.

Main lines:
- Seeded user/article arrays plus simple lookup and creation helpers

Functionality:
- Stores predictable fake users and articles directly in PHP arrays for lightweight tests.

Why it matters:
- Keeps lightweight tests decoupled from MySQL when persistence behavior is not under test.

## 8. `src/Service/`

### `src/Service/RouteRegistry.php`

File: [src/Service/RouteRegistry.php](src/Service/RouteRegistry.php)

Necessity:
- Explicit route catalog.

Main lines:
- `8-25`: `RouteRegistry::all()`
- `11-17`: web routes
- `18-23`: API route identifiers

Functionality:
- Documents the app's top-level entrypoints.
- Separates web page routes from API endpoints.

Why it matters:
- A small file, but it gives the project a proper place to describe route ownership.

## 9. `src/Repository/`

This folder is mainly entity/data-shape definitions. These classes are simple containers, not full ORM models.

### `src/Repository/Article.php`

File: [src/Repository/Article.php](src/Repository/Article.php)

Necessity:
- Represents article data in PHP object form.

Main lines:
- `3`: `class Article`
- `5-19`: public article fields
- `21-45`: constructor

Functionality:
- Stores article identity, author, content, category, status, cover image, metrics, and timestamps.
- Used by `hydrateArticle()` in `ArticleController`.

### `src/Repository/Community.php`

File: [src/Repository/Community.php](src/Repository/Community.php)

Necessity:
- Represents a community record.

Main lines:
- `4`: `class Community`
- `6-13`: main properties
- `15-31`: constructor

Functionality:
- Encapsulates the creator, name, description, icon, topics, member count, and creation time.

### `src/Repository/CommunityMember.php`

File: [src/Repository/CommunityMember.php](src/Repository/CommunityMember.php)

Necessity:
- Represents membership state for one user in one community.

Main lines:
- `4`: `class CommunityMember`
- `6-12`: membership fields
- `14-28`: constructor

Functionality:
- Tracks role, joined date, ban status, and notification preferences.

### `src/Repository/CommunityMessage.php`

File: [src/Repository/CommunityMessage.php](src/Repository/CommunityMessage.php)

Necessity:
- Represents a community chat message.

Main lines:
- `4`: `class CommunityMessage`
- `6-12`: message fields
- `14-26`: constructor

Functionality:
- Stores which community and user the message belongs to, the content, deletion state, and timestamp.

### `src/Repository/SavedArticle.php`

File: [src/Repository/SavedArticle.php](src/Repository/SavedArticle.php)

Necessity:
- Represents a saved-article relation.

Main lines:
- `2`: `class savedarticle`
- `4-10`: properties
- `12-18`: constructor

Functionality:
- Holds saved article metadata such as `note`, `collection`, and `isPinned`.

Notes:
- This class still uses older naming and loose typing.
- It works, but it is structurally older than the stricter typed classes like `Community`.

### `src/Repository/subscription.php`

File: [src/Repository/subscription.php](src/Repository/subscription.php)

Necessity:
- Represents a subscription record.

Main lines:
- `2`: `class subscription`
- `4-12`: fields
- `14-21`: constructor

Functionality:
- Stores plan, amount, currency, status, promo code, and lifecycle dates.

### `src/Repository/users.php`

File: [src/Repository/users.php](src/Repository/users.php)

Necessity:
- Represents a user record in object form.

Main lines:
- `3`: `class Users`
- `4-12`: user fields
- `14-33`: constructor

Functionality:
- Stores account identity, credentials, plan, and flags like `isPremium` and `isAdmin`.

Notes:
- Like `SavedArticle.php`, this is an older style class compared with newer typed classes.

## 10. `src/Controller/`

This folder contains the main business logic. In this project, many controllers are procedural files with functions rather than class-based controllers.

### `src/Controller/ArticleController.php`

File: [src/Controller/ArticleController.php](src/Controller/ArticleController.php)

Necessity:
- Core article CRUD and article hydration logic.

Main lines:
- `4-5`: loads DB bootstrap and `Article` entity
- `7-15`: table/column helpers
- `17-42`: author select and join helpers
- `49-70`: `createArticle()`
- `72-75`: alias `addArticle()`
- `78-89`: `getAllArticles()`
- `92-104`: `getArticlesByAuthor()`
- `107-118`: `getPublishedArticles()`
- `120-134`: `getArticleById()`
- `136-152`: `searchArticles()`
- `154-183`: `updateArticle()`
- `185-190`: `deleteArticle()` as soft delete
- `192-215`: `hydrateArticle()`

Functionality:
- Centralizes article persistence.
- Adapts to schema differences such as optional `user_profile` and `avatar` columns.
- Converts raw DB rows into `Article` objects.

Why it matters:
- This is one of the most important files in the app because feed loading, publishing, editing, and reading all depend on it.

### `src/Controller/UserController.php`

File: [src/Controller/UserController.php](src/Controller/UserController.php)

Necessity:
- Core user management and authentication helper logic.

Main lines:
- `19-36`: `AddUser()`
- `45-58`: `getAllUsers()`
- `65-83`: `searchUsers()`
- `90-101`: `ConnectUser()`
- `108-114`: `getUserByEmail()`
- `121-127`: `getUserById()`
- `131-158`: `updateUser()`
- `162-166`: `deleteUser()`
- `173-208`: `upgradeToPremium()`

Functionality:
- Handles registration, lookup, admin editing, login verification, and premium upgrade flow.
- Uses `password_hash()` and `password_verify()` instead of plain-text credentials.

Why it matters:
- It is the server-side backbone for sign-up, sign-in, profile/user directory, and premium logic.

### `src/Controller/SavedArticleController.php`

File: [src/Controller/SavedArticleController.php](src/Controller/SavedArticleController.php)

Necessity:
- Manages save/unsave behavior and saved article retrieval.

Main lines:
- `7-47`: schema helpers and timestamp helper
- `50-79`: `saveArticle()`
- `82-91`: `isArticleSaved()`
- `94-104`: `getSavedId()`
- `107-134`: `getSavedArticlesByUser()`
- `137-144`: `unsaveArticle()`

Functionality:
- Prevents duplicate saves.
- Fetches a user's saved items with article and author context.

### `src/Controller/CommunityController.php`

File: [src/Controller/CommunityController.php](src/Controller/CommunityController.php)

Necessity:
- Main community, chat, membership, and thread API logic.

Main lines:
- `11-21`: input/session helpers
- `74-93`: display-name resolution
- `95-164`: community creation logic and action wrapper
- `166-214`: list and single-community fetchers
- `215-274`: user-community listing and actions
- `275-331`: join/leave behavior and action handlers
- `355-439`: message loading/sending endpoints
- `466-526`: ensures thread tables exist
- `527-557`: membership/premium checks
- `558-755`: thread listing, creation, deletion, and messaging actions

Functionality:
- This file acts like a mini community module on its own.
- It supports community CRUD-like behavior, chat history, premium-thread gating, and thread messages.

Why it matters:
- It is the most feature-dense controller in the project.

### `src/Controller/CommunityMemberController.php`

File: [src/Controller/CommunityMemberController.php](src/Controller/CommunityMemberController.php)

Necessity:
- Lower-level CRUD around membership rows.

Main lines:
- `7-20`: `createCommunityMember()`
- `23-31`: `getCommunityMembers()`
- `32-39`: `getCommunityMemberById()`
- `40-62`: `updateCommunityMember()`
- `63-68`: `deleteCommunityMember()`
- `69-85`: `hydrateCommunityMember()`

Functionality:
- Complements `CommunityController` with object-level membership handling.

### `src/Controller/SubscriptionController.php`

File: [src/Controller/SubscriptionController.php](src/Controller/SubscriptionController.php)

Necessity:
- CRUD-style subscription handling.

Main lines:
- `8-24`: `createSubscription()`
- `26-29`: alias `addSubscription()`
- `31-37`: `getSubscriptionsByUser()`
- `38-46`: `getSubscriptionById()`
- `47-75`: `updateSubscription()`
- `76-81`: `deleteSubscription()`
- `82-96`: `hydrateSubscription()`

Functionality:
- Encapsulates subscription record creation, update, and object hydration.

## 11. `views/`

### `views/home.php`

File: [views/home.php](views/home.php)

Necessity:
- The main rendered page shell for the application.

Main lines:
- `4-7`: `iblogProjectRoot()`
- `9-17`: `inlineComponentScript()`
- `19-24`: `assetUrl()`
- `32-34`: font loading for `Playfair Display`, `DM Sans`, `JetBrains Mono`, `Manrope`, and `Marcellus`
- `35+`: CSS asset loading
- `103-105`: article reader overlay mount point
- later script section: injects all frontend component scripts

Functionality:
- Builds the page shell
- loads assets
- creates container elements for the landing page, dashboard, reader, auth, rails, writer, search, profile, chat, and more
- injects frontend behavior scripts

Why it matters:
- This is effectively the app shell for the browser UI.

### `views/reset-password.php`

File: [views/reset-password.php](views/reset-password.php)

Necessity:
- Dedicated standalone view for password resets.

Main lines:
- `4-5`: sanitizes `email` and `token` from query parameters
- `16-27`: page-local CSS
- `31-38`: form markup
- `41-77`: frontend logic that posts the reset request

Functionality:
- Renders the password-reset interface.
- Validates basic client-side conditions before calling the auth API.

## 12. `public/`

### `public/index.php`

File: [public/index.php](public/index.php)

Necessity:
- Public-folder entrypoint for cleaner deployment shape.

Main lines:
- `4`: requires `../index.php`

Functionality:
- Delegates to the root app entry while keeping a standard public web root option.

### `public/reset-password.php`

File: [public/reset-password.php](public/reset-password.php)

Necessity:
- Public-folder version of the password reset page.

Main lines:
- `4`: requires `../reset-password.php`

Functionality:
- Mirrors the root reset entrypoint from the public web root.

### `public/uploads/`

Necessity:
- Persistent user-generated assets such as avatars and cover images.

Functionality:
- Stores uploaded media in web-accessible folders.

Notes:
- This is runtime content, not core architecture logic.

## 13. Legacy `backend/` Layer

This part is still active. It matters because much of the frontend still points at these paths.

### `backend/config/database.php`

File: [backend/config/database.php](backend/config/database.php)

Necessity:
- Legacy include path for code expecting `backend/config/database.php`.

Main lines:
- `4`: requires `src/Database/Database.php`

Functionality:
- Pure compatibility shim.

### `backend/config/env.php`

File: [backend/config/env.php](backend/config/env.php)

Necessity:
- Legacy include path for environment helper loading.

Main lines:
- `4`: requires `src/Utils/Env.php`

Functionality:
- Pure compatibility shim.

### `backend/controller/ArticleController.php`

File: [backend/controller/ArticleController.php](backend/controller/ArticleController.php)

Necessity:
- Old path preserved for existing API includes.

Main lines:
- `4`: requires `src/Controller/ArticleController.php`

Functionality:
- Compatibility shim only.

### `backend/controller/SavedArticleController.php`

File: [backend/controller/SavedArticleController.php](backend/controller/SavedArticleController.php)

Necessity:
- Old save-controller include path preserved.

Main lines:
- `4`: requires `src/Controller/SavedArticleController.php`

Functionality:
- Compatibility shim only.

### `backend/controller/UserController.php`

File: [backend/controller/UserController.php](backend/controller/UserController.php)

Necessity:
- Old user-controller include path preserved.

Main lines:
- `4`: requires `src/Controller/UserController.php`

Functionality:
- Compatibility shim only.

### `backend/controller/CommunityController.php`

File: [backend/controller/CommunityController.php](backend/controller/CommunityController.php)

Necessity:
- Old community-controller include path preserved.

Main lines:
- `4`: requires `src/Controller/CommunityController.php`

Functionality:
- Compatibility shim only.

## 14. Main Backend API Entry Files

These files are not just wrappers. They are still active HTTP entrypoints used by the frontend.

### `backend/view/components/article/api-articles.php`

File: [backend/view/components/article/api-articles.php](backend/view/components/article/api-articles.php)

Necessity:
- Main article API endpoint used by the frontend.

Main lines:
- `4-9`: sets JSON headers and loads dependencies
- `11`: starts the session
- `22-33`: JSON response helpers
- `35-78`: request parsing and pagination helpers
- `80-117`: auth/session helpers
- `139-212`: cover image upload and path normalization
- `213-377`: comments, saved-state, likes, and derived data loaders
- `378-486`: serialization helpers
- `487-532`: visible/saved article list preparation

Functionality:
- Acts as the HTTP boundary around the article system.
- Converts controller/entity data into frontend-ready JSON payloads.
- Handles pagination, cover image management, saved state, likes, comments, and article serialization.

Why it matters:
- Even with the new `src/` structure, this is still the runtime endpoint the browser calls.

### `backend/view/components/auth/api-auth.php`

File: [backend/view/components/auth/api-auth.php](backend/view/components/auth/api-auth.php)

Necessity:
- Main authentication and user-account API endpoint.

Main lines:
- `4-9`: JSON header and dependencies
- `11`: starts session
- `19-30`: response helpers
- `32-42`: JSON request parsing
- `42-49`: password-strength rule
- `50-65`: payload shaping
- `67-134`: schema checks and profile table support
- `135-202`: profile upload/path helpers
- `203-283`: profile merge/persist helpers
- `284-294`: session login helper
- `295-354`: reset table and private-message table creation helpers
- `355-572`: messaging directory and thread helpers
- `573-592`: password reset and welcome email helpers

Functionality:
- Handles sign-up, sign-in, profile enrichment, password reset infrastructure, and private messages.

Why it matters:
- This is the live auth API surface, not just an internal helper.

### `backend/view/components/auth/search-index.php`

File: [backend/view/components/auth/search-index.php](backend/view/components/auth/search-index.php)

Necessity:
- Search endpoint for articles, people, or combined results.

Main lines:
- `4-5`: response headers
- `7-18`: response helpers
- `20-28`: request body parser
- `30-39`: schema inspection helpers
- `40-159`: tokenization and scoring logic
- `160-253`: article search loading
- `254-337`: user search loading
- `338`: loads DB connection

Functionality:
- Performs ranked search using text tokenization and matching heuristics instead of a dedicated search engine.

## 15. Frontend Files Relevant To Article Titles

These are the files tied to your request about making article titles smaller and changing their font.

### `backend/view/components/article-reader/article-reader.css`

File: [backend/view/components/article-reader/article-reader.css](backend/view/components/article-reader/article-reader.css)

Necessity:
- Styles the full article reader overlay.

Main lines:
- `50-55`: `.reader-cover-title`
- `75-81`: no-cover title styling
- `259`: mobile title size

Current title behavior:
- The full article reader title now uses `Marcellus`
- size is now `24px`
- no-cover version is `26px`
- mobile version is `18px`

Why it matters:
- This is the title shown in the expanded article reader from the screenshot.

### `backend/view/components/article-card/article-card.css`

File: [backend/view/components/article-card/article-card.css](backend/view/components/article-card/article-card.css)

Necessity:
- Styles the article cards shown in the feed.

Main lines:
- `75-78`: `.card-title`

Current title behavior:
- The feed card title now uses `Manrope`
- size is now `17px`
- weight is `800`

### `backend/view/components/article-card/article-card.js`

File: [backend/view/components/article-card/article-card.js](backend/view/components/article-card/article-card.js)

Necessity:
- Renders article card markup into the feed.

Main lines:
- `168`: renders the title node
- `168`: clicking the title calls `IBlog.Feed.openReader(...)`

Functionality:
- Connects the title text to the article reader overlay behavior.

## 16. Tests

## `tests/bootstrap.php`

File: [tests/bootstrap.php](tests/bootstrap.php)

Necessity:
- Test bootstrap and fallback autoloader.

Main lines:
- `4-7`: loads Composer autoload when available
- `8-28`: fallback autoload registration
- `20-27`: maps `IBlog\` classes into `src/`

Functionality:
- Guarantees tests can locate project code even if Composer autoload is unavailable in some situations.

### `tests/Support/EndpointTestCase.php`

File: [tests/Support/EndpointTestCase.php](tests/Support/EndpointTestCase.php)

Necessity:
- Base test case for endpoint-driven tests.

Main lines:
- `13`: `setUp()`
- `20`: `db()`
- `25`: `signIn(...)`

Functionality:
- Standardizes test setup, DB access, and authenticated-session helpers.

### `tests/Support/TestApplication.php`

File: [tests/Support/TestApplication.php](tests/Support/TestApplication.php)

Necessity:
- Test app harness that prepares the application environment.

Functionality:
- Used behind the test suite to build a controlled application context.

### `tests/Support/WebClient.php`

File: [tests/Support/WebClient.php](tests/Support/WebClient.php)

Necessity:
- Internal HTTP-like test client.

Main lines:
- `16`: constructor
- `22`: `get(...)`
- `32`: `postJson(...)`
- `42`: `postForm(...)`
- `57`: request executor
- `104`: local request fallback
- `162`: coverage append helper
- `224-233`: `HttpResponse`

Functionality:
- Simulates requests against local endpoints.
- Captures response bodies, headers, cookies, and coverage metadata.

### `tests/Support/local_request.php`

File: [tests/Support/local_request.php](tests/Support/local_request.php)

Necessity:
- Helper used by the test request system.

Functionality:
- Supports local execution of endpoint requests without a remote server roundtrip.

## 17. Test Suites

### `tests/Unit/`

Purpose:
- Tests isolated controller/helper logic quickly.

Current important file:
- [tests/Unit/ControllerCoverageTest.php](tests/Unit/ControllerCoverageTest.php)

Main lines:
- `14`: user controller helper behavior
- `44`: article controller list/search behavior
- `69`: saved-article helper behavior

### `tests/Integration/`

Purpose:
- Tests full workflows across APIs, sessions, DB, and serialization.

Current important files:
- [tests/Integration/AdminUserManagementTest.php](tests/Integration/AdminUserManagementTest.php)
- [tests/Integration/ArticleWorkflowTest.php](tests/Integration/ArticleWorkflowTest.php)
- [tests/Integration/AuthenticationTest.php](tests/Integration/AuthenticationTest.php)
- [tests/Integration/PaginationRequirementsTest.php](tests/Integration/PaginationRequirementsTest.php)
- [tests/Integration/SearchAndCommunityTest.php](tests/Integration/SearchAndCommunityTest.php)

What they cover:
- admin user operations
- article publish/edit/save/comment workflows
- authentication and password reset
- pagination behavior
- search and community workflows

### `tests/Advanced/`

Purpose:
- Edge cases and API boundary validation.

Current important files:
- [tests/Advanced/ArticleApiEdgeCaseTest.php](tests/Advanced/ArticleApiEdgeCaseTest.php)
- [tests/Advanced/SearchIndexEdgeCaseTest.php](tests/Advanced/SearchIndexEdgeCaseTest.php)

What they cover:
- invalid methods
- malformed input
- save/like/comment edge cases
- cover image normalization
- search ranking and failure fallback behavior

### `tests/Performance/`

Purpose:
- Intended home for performance-oriented tests.

Current state:
- Currently empty.

### `tests/Functional/`

Purpose:
- Legacy suite folder from the previous structure.

Current state:
- Present in the repository, but not part of the active `phpunit.xml` suite definitions.

## 18. Request Flow Examples

### Home page load

1. `index.php` defines the project root and requires `views/home.php`.
2. `views/home.php` loads CSS, fonts, shell markup, and frontend scripts.
3. Frontend JS calls legacy API endpoints under `backend/view/components/...`.
4. Those endpoints load the compatibility shims under `backend/config` and `backend/controller`.
5. The shims forward execution into `src/Database/*` and `src/Controller/*`.

### Article publish flow

1. The writer UI collects title/body/category/tags/cover.
2. Frontend sends data to `backend/view/components/article/api-articles.php`.
3. That file validates input and may normalize/upload the cover image.
4. It calls article functions from `src/Controller/ArticleController.php`.
5. Data is stored according to the schema from `base.sql`.

### Password reset flow

1. User opens `reset-password.php` or `public/reset-password.php`.
2. The page rendered by `views/reset-password.php` captures password input.
3. The browser sends the request to `backend/view/components/auth/api-auth.php`.
4. Auth logic checks reset token state against the `password_resets` table from `base.sql`.

## 19. Structural Assessment

What is already good:

- configuration now has a dedicated home
- canonical backend logic is grouped under `src/`
- views have their own folder
- tests are split into clear suite types
- route definitions have a named registry
- public entrypoints exist

What is still transitional:

- the frontend still depends heavily on `backend/view/components/...`
- some repository classes still use old naming and loose typing
- the API surface is still path-based rather than routed through one dispatcher
- `tests/Functional/` is still a leftover legacy folder
- `tests/Performance/` exists structurally but is not populated yet

## 20. Short Recommendation

If you want the structure to look even closer to a conventional modern PHP app, the next cleanup step would be:

1. move or mirror active frontend component assets out of `backend/view/components/`
2. standardize old repository class names such as `savedarticle` and `subscription`
3. introduce a single front controller or router for API endpoints
4. remove or archive legacy folders once the frontend no longer depends on them
