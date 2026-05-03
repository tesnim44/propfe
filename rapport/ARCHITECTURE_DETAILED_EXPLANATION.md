# IBlog Architecture Detailed Explanation

## Goal of This Document

This file explains the current architecture of the project after the refactor.  
It answers three questions for each important file:

1. Why the file is necessary.
2. What the file does.
3. Which code blocks are the main lines and why they matter.

This explanation is based on the current code in the repository, not only on the professor example.

---

## 1. Global Architecture

The project now follows a layered architecture:

1. `config/`
   Stores application and database configuration.
2. `src/Database/`
   Handles PDO creation, connection reuse, database helper functions, and test database creation.
3. `src/Repository/`
   Contains all direct SQL access.  
   Repositories are the only layer that should know table names and SQL queries.
4. `src/Service/`
   Contains business logic.  
   Services validate, orchestrate, and decide workflow before or after calling repositories.
5. `src/Controller/`
   Contains compatibility wrappers and HTTP-style action functions.  
   Controllers receive request data, call services, and return arrays or JSON.
6. `src/Utils/`
   Contains reusable helpers such as environment loading and validation.
7. `tests/`
   Verifies the architecture through unit, functional, integration, and coverage tests.

### Request Flow

The most common flow is:

`HTTP/API request -> Controller -> Service -> Repository -> Database`

Example for article listing:

`api-articles.php -> ArticleController functions -> ArticleService -> ArticleRepository -> PDO`

This separation is important because:

- controllers stay thin;
- business rules are not mixed with SQL;
- repositories stay focused on persistence;
- tests can target each layer independently.

---

## 2. Why This Architecture Is Better Than the Old One

Before this refactor, several concerns were mixed:

- some files acted like models and SQL containers at the same time;
- the database bootstrap logic was coupled to legacy global behavior;
- business rules were sometimes hidden inside controller-style functions;
- testability was weaker because database access was not consistently isolated.

Now:

- database creation is centralized;
- repositories own SQL;
- services own rules;
- controllers own request/response adaptation;
- tests can instantiate repositories and services directly.

---

## 3. Configuration Layer

### `config/config.php`

#### Why this file is necessary

This file centralizes runtime configuration.  
Without it, database host, database name, environment mode, and root path would be duplicated in multiple places.

#### What it does

- loads `.env` values through `src/Utils/Env.php`;
- builds one normalized configuration array;
- exposes that array through `iblogConfig()`.

#### Main lines

- `4-6`: loads the env helper and reads the `.env` file.
- `8-34`: defines `iblogConfig()`.
- `15`: computes the project folder name dynamically.
- `17-32`: builds the application and database configuration arrays.
- `24-30`: defines DB DSN, host, port, user, password, name, and fallback database names.

#### Why the implementation matters

The key idea is memoization:

- `10-13` stores config in a static variable.
- This avoids rebuilding the same configuration repeatedly.

That makes the file both simple and efficient.

---

## 4. Database Layer

### `src/Database/Database.php`

#### Why this file is necessary

This is the most important infrastructure file in the project.  
It is necessary because the rest of the application needs:

- one reliable way to build PDO connections;
- support for MySQL connections and DSN overrides;
- compatibility with the older codebase that still expects `$cnx` and global helpers;
- graceful database failure messages instead of silent crashes.

#### High-level structure

This file has two parts:

1. the namespaced `IBlog\Database\Database` class;
2. a global compatibility/bootstrap section used by legacy entry points.

#### Part A: `Database` class

##### Main lines

- `6-61`: `final class Database`
- `8-9`: singleton storage with `$instance` and `$fingerprint`
- `13-41`: private constructor that creates the PDO connection
- `43-51`: `getInstance()`
- `53-57`: `reset()`
- `59-62`: `getConnection()`
- `64-67`: `driver()`

##### Functionality

The class exists to guarantee a single reusable connection per configuration.

###### `__construct(array $config)` at `13-41`

This method:

- reads DSN, username, and password;
- builds a MySQL DSN automatically if no explicit DSN is provided;
- creates a PDO connection;
- configures PDO error mode, fetch mode, non-emulated prepares, and timeout;
- applies a consistent PDO configuration for the active connection.

This is critical because repositories depend on predictable PDO behavior.

###### `getInstance(array $config)` at `43-51`

This is the singleton access point.

It uses:

- `md5(serialize($config))` at `45`

to detect whether the requested configuration changed.  
If the config changes, the singleton is recreated.

That is more flexible than a strict singleton with one permanent connection.

###### `reset()` at `53-57`

This is mainly useful for recovery and tests.  
It clears the singleton and fingerprint so the next `getInstance()` builds a fresh connection.

###### `driver()` at `64-67`

This returns the normalized PDO driver name.  
Repositories use this together with helper functions to handle schema differences while staying on MySQL.

#### Part B: global bootstrap and compatibility section

##### Main lines

- `70-73`: loads env and config dependencies
- `75-78`: initializes global DB settings
- `80-87`: `dbDriver()`
- `89-104`: `dbTableExists()`
- `106-128`: `dbColumnExists()`
- `130-138`: error helper functions
- `140-152`: `databaseHosts()`
- `154-161`: `databaseNames()`
- `163-166`: `databasePort()`
- `168-185`: `databaseReachable()`
- `187-274`: `getDatabaseConnection()`
- `276-282`: initializes the global `$cnx`

##### Why this second part exists

The class alone would be enough for a fully modern object-oriented application.  
However, this project still has legacy entry points and procedural controllers that expect:

- helper functions such as `dbDriver()`,
- automatic global connection bootstrapping,
- a global `$cnx` variable.

So this section preserves compatibility while still allowing the architecture to move toward repositories and services.

##### Important helper functions

###### `dbDriver(?PDO $pdo)` at `80-87`

Returns the current driver name or `'unknown'` if there is no valid PDO object.  
Repositories use it for defensive branching and diagnostics around the active PDO connection.

###### `dbTableExists(PDO $cnx, string $table)` at `89-104`

Checks whether a table exists.

It is used by repositories such as:

- `ArticleRepository`
- `SavedArticleRepository`

to adapt joins and selected columns when optional tables exist.

###### `dbColumnExists(PDO $cnx, string $table, string $column)` at `106-128`

Checks whether a column exists.

This is useful when the schema may differ slightly between environments or tests.  
For example, the code can decide whether to use `users.avatar` or not.

###### `databaseHosts()` and `databaseNames()` at `140-161`

These functions create a fallback strategy:

- multiple hosts can be tried;
- multiple database names can be tried.

That makes the app more tolerant to local environment differences.

###### `databaseReachable()` at `168-185`

This tests whether the MySQL server can be reached before trying a full connection.  
It improves error reporting and avoids slower failures.

###### `getDatabaseConnection()` at `187-274`

This is the central runtime connection resolver.

It supports:

- direct DSN override;
- host/name fallback combinations;
- detailed error reporting;
- singleton reset after failed attempts.

This function is one of the most important blocks in the project because all entry points eventually depend on it.

###### Final bootstrap at `276-282`

The file tries to populate `$cnx` immediately:

- on success: `$cnx` becomes a valid PDO;
- on failure: `$cnx` becomes `null` and the error message is stored globally.

This allows controllers to detect connection failure and return a controlled JSON response instead of fatal output.

---

### `src/Database/FakeDatabase.php`

#### Why this file is necessary

This file is necessary for isolated testing.  
It gives tests a lightweight in-memory fake data source without touching MySQL.

#### What it does

- seeds predictable users and articles;
- exposes simple lookup helpers;
- allows tests to append fake records without external setup.

#### Main lines

- seeded arrays and lightweight user/article helper methods

#### Why it matters

Without this helper, every repository unit test would have to repeat PDO setup code.  
This file keeps tests shorter, cleaner, and more deterministic.

---

## 5. Repository Layer

The repository layer is where SQL lives.  
Each repository is necessary because it isolates persistence logic for one domain area.

---

### `src/Repository/UserRepository.php`

#### Why this file is necessary

This file is the persistence layer for users.  
It is necessary because:

- authentication depends on user lookup;
- admin management depends on CRUD operations;
- premium upgrade depends on both user updates and subscription persistence.

#### Main lines

- `9-13`: constructor
- `15-31`: `create()`
- `33-46`: `findAll()`
- `48-63`: `search()`
- `65-73`: `authenticate()`
- `75-81`: `findByEmail()`
- `83-89`: `findById()`
- `91-121`: `update()`
- `123-127`: `delete()`
- `129-155`: `upgradeToPremium()`

#### Functionality by method

###### `create()` at `15-31`

- hashes the password with `password_hash()` at `17`;
- inserts name, email, password, plan, premium flag, and admin flag.

This is important because password hashing must happen before data reaches the database.

###### `findAll()` at `33-46`

Returns all users in descending ID order.  
It uses `COALESCE()` to normalize nullable fields such as `isPremium`, `isAdmin`, and `status`.

That protects the rest of the app from schema differences or missing values.

###### `search()` at `48-63`

Searches in both `name` and `email`.  
This powers admin listing and people search style features.

###### `authenticate()` at `65-73`

This method is the authentication core:

- `67-70`: find the user by email;
- `72`: verify the password hash.

This is a strong design decision because password verification stays in the repository boundary, close to persisted user credentials.

###### `findByEmail()` and `findById()` at `75-89`

These are reusable lookup primitives used by controllers, services, and tests.

###### `update()` at `91-121`

This method:

- loads the current user first;
- returns `false` if the user does not exist;
- keeps the old password when the new password is empty;
- updates the main editable fields.

The main logic is at:

- `93-96`: existence guard
- `98-99`: password preservation / rehash logic
- `101-120`: update query and parameters

###### `delete()` at `123-127`

Performs physical deletion of the user row.

###### `upgradeToPremium()` at `129-155`

This is one of the most important methods in the file.

It performs two business-persistence actions:

1. updates the user row to premium;
2. tries to create a subscription row.

Main logic:

- `131-134`: updates `isPremium` and `plan`
- `136-151`: inserts a subscription entry
- `137-139`: uses MySQL `DATE_ADD(...)` for premium expiration
- `151-152`: catches `PDOException` silently

That catch is intentional.  
The design says: the user should still become premium even if subscription insertion fails.

---

### `src/Repository/ArticleRepository.php`

#### Why this file is necessary

This file centralizes all article persistence logic.  
It is necessary because article operations are more complex than simple CRUD:

- article list queries join author information;
- public vs author-specific visibility differs;
- optional avatar sources must be handled across schemas.

#### Main lines

- `15-36`: `create()`
- `38-49`: `findAll()`
- `51-64`: `findByAuthor()`
- `66-77`: `findPublished()`
- `79-93`: `findById()`
- `95-108`: `search()`
- `110-141`: `update()`
- `143-147`: `softDelete()`
- `149-165`: `authorSelect()`
- `167-175`: `authorJoin()`
- `177-197`: `hydrate()`

#### Important design decisions

###### `create()` at `15-36`

The method uses MySQL `NOW()` directly for creation timestamps.  
That keeps repository writes aligned with the production database.

###### `findAll()`, `findPublished()`, `search()` at `38-108`

These methods all reuse:

- `authorSelect()`
- `authorJoin()`
- `hydrate()`

This is a good repository design because:

- author logic is not duplicated in every query;
- response object shape remains consistent.

###### `update()` at `110-141`

The method first loads the article:

- `112-115`: if the article does not exist, return `false`.

Then it updates only the editable fields while preserving missing values from the existing article object.

###### `softDelete()` at `143-147`

This is important architecturally.  
Deleting an article does not remove the row: it marks `status = 'deleted'`.

That allows:

- safer data handling;
- hiding deleted articles from public queries;
- maintaining history.

###### `authorSelect()` at `149-165`

This method adapts the query depending on schema availability:

- if both `user_profile` and `users.avatar` exist, it uses both;
- if only one exists, it uses that source;
- otherwise it falls back to an empty string.

This is a robustness mechanism for mixed environments.

###### `hydrate()` at `177-197`

This converts raw SQL rows into a predictable article object.  
It normalizes types:

- integers for IDs, counts, views;
- strings for text fields;
- defaults for missing values.

This is important because upper layers should not care about raw database row inconsistencies.

---

### `src/Repository/SavedArticleRepository.php`

#### Why this file is necessary

This file manages the "saved article" feature.  
It is necessary because saving is not just a simple insert:

- duplicates must be prevented;
- saved rows must be joined back to article and author information;
- removal must be scoped to the correct user.

#### Main lines

- `14-43`: `save()`
- `45-56`: `isSaved()`
- `58-70`: `findSavedId()`
- `72-101`: `findByUser()`
- `103-113`: `unsave()`
- `115-141`: dynamic author helpers

#### Functionality

###### `save()` at `14-43`

- `16-24`: checks whether the article is already saved;
- `24-26`: returns a failure message if duplicate;
- `28-37`: inserts the new saved record;
- `39-42`: returns a success/failure payload.

This is why the file belongs in the repository layer: it mixes SQL existence checks and SQL insertion.

###### `isSaved()` at `45-56`

Simple boolean existence check for toggle logic.

###### `findSavedId()` at `58-70`

Returns the exact `savedarticle.id`, which is needed for unsave actions.

###### `findByUser()` at `72-101`

This is the richest query in the file.  
It joins:

- saved rows,
- article rows,
- author information.

It also ensures only published articles are returned:

- `95`: `AND a.status = "published"`

###### `unsave()` at `103-113`

Deletes by both saved ID and user ID.  
That prevents one user from deleting another user’s saved record.

---

### `src/Repository/SubscriptionRepository.php`

#### Why this file is necessary

This file isolates subscription persistence.  
It is necessary for:

- premium billing history,
- user subscription display,
- editing and deleting subscription records.

#### Main lines

- `15-32`: `create()`
- `34-40`: `findByUser()`
- `42-49`: `findById()`
- `51-78`: `update()`
- `80-84`: `delete()`
- `86-100`: `hydrate()`

#### Key functionality

###### `create()` at `15-32`

Creates a subscription record with sensible defaults:

- plan defaults to `premium`;
- currency defaults to `TND`;
- status defaults to `active`;
- expiration defaults to 30 days later.

###### `update()` at `51-78`

Loads the current subscription first, then merges provided fields with existing values.  
This prevents accidental overwriting of fields with empty defaults.

###### `hydrate()` at `86-100`

Normalizes row values into an object with correct types.

---

### `src/Repository/CommunityMemberRepository.php`

#### Why this file is necessary

This file manages membership rows independently of full community logic.  
It is necessary when a part of the application needs direct CRUD on `communitymember`.

#### Main lines

- `15-30`: `create()`
- `32-40`: `findByCommunity()`
- `42-49`: `findById()`
- `51-72`: `update()`
- `74-78`: `delete()`
- `80-92`: `hydrate()`

#### What it does

This repository is a straightforward CRUD repository:

- inserts members,
- lists community members,
- edits role / ban / notification state,
- deletes membership rows.

Its biggest value is separation:

- the simple member CRUD lives here;
- the more advanced community workflows live in `CommunityRepository`.

---

### `src/Repository/CommunityRepository.php`

#### Why this file is necessary

This is the largest repository because community features are the richest part of the application.  
It is necessary because communities require:

- community creation,
- membership rules,
- chat messages,
- thread creation,
- thread message persistence,
- premium checks,
- dynamic table creation for thread support.

#### Main lines

- `14-29`: `create()`
- `31-41`: `addCreatorMembership()`
- `43-68`: `findAll()` and `findById()`
- `70-89`: `findByUser()`
- `91-121`: `join()`
- `123-142`: `leave()`
- `144-160`: `isMember()`
- `162-184`: `checkMembership()`
- `186-202`: `isUserPremium()`
- `204-211`: `findUserName()`
- `213-242`: community chat messages
- `244-301`: thread-table bootstrap
- `303-428`: thread and thread-message methods
- `430-441`: `mapCommunity()`

#### Functional explanation

###### `create()` at `14-29`

Creates a new community row and returns the inserted ID.  
This return value is important because the service later uses it to create the creator membership.

###### `addCreatorMembership()` at `31-41`

Immediately inserts the creator into `communitymember` with role `creator`.  
This is necessary so the creator is not just the owner in `community`, but also an actual member.

###### `findAll()` and `findById()` at `43-68`

These join the creator’s user name and then map the row through `mapCommunity()`.

###### `findByUser()` at `70-89`

Returns all communities the user belongs to and excludes banned memberships:

- `76`: `cm.isBanned = 0`

###### `join()` at `91-121`

This method is essential:

- checks whether the user is already a member;
- if already present, returns success with `alreadyMember = true`;
- otherwise inserts membership;
- increments `memberCount`.

That means it is not just a data insert, but a consistency workflow.

###### `leave()` at `123-142`

Deletes the membership and decrements `memberCount`, but never below zero.

###### `isMember()` and `checkMembership()` at `144-184`

These power access control:

- thread access,
- chat access,
- membership status display.

###### `isUserPremium()` at `186-202`

Checks premium either by:

- `isPremium = 1`, or
- `plan = 'premium'`

This double check makes the premium gate more robust.

###### `findMessages()` and `createMessage()` at `213-242`

This is the community chat persistence block:

- fetch chat messages,
- join sender names,
- insert new messages.

###### `ensureThreadTables()` at `244-301`

This is one of the most architecturally interesting methods.

It creates thread-related tables lazily if they do not exist using the MySQL schema path.

This means thread functionality can work even in test environments that start from a minimal schema.

###### `findThreads()`, `createThread()`, `deleteThread()`, `threadExists()`, `findThreadMessages()`, `createThreadMessage()` at `303-428`

These methods provide the persistence backbone for premium community discussions.

Important details:

- `findThreads()` computes `replyCount` through a subquery;
- `deleteThread()` soft-deletes the thread and also soft-deletes its messages;
- `threadExists()` ensures the thread is still active;
- `findThreadMessages()` excludes deleted threads and deleted messages.

###### `mapCommunity()` at `430-441`

This standardizes how a community is exposed to upper layers:

- integer IDs,
- icon fallback,
- creator name,
- topic tags converted from comma-separated text to array.

---

## 6. Service Layer

Services are necessary because they prevent controllers from becoming fat and prevent repositories from containing business rules that are not purely about persistence.

---

### `src/Service/AuthService.php`

#### Why this file is necessary

It centralizes authentication and registration rules.

#### Main lines

- `15-22`: `login()`
- `24-43`: `register()`
- `45-48`: `upgradeToPremium()`

#### Functionality

###### `login()` at `15-22`

- validates email format;
- rejects empty password;
- delegates real authentication to `UserRepository`.

###### `register()` at `24-43`

This is the main registration workflow:

- validate name;
- validate email;
- validate password;
- refuse duplicate email;
- create the user;
- reload the saved user record.

That is proper service-layer logic because it combines validation and multiple repository steps.

---

### `src/Service/ArticleService.php`

#### Why this file is necessary

It is the business entry point for articles.  
Right now it is thin, but it is still useful because it gives one stable place for future article rules.

#### Main lines

- `14-17`: create
- `19-22`: findAll
- `24-27`: findPublished
- `29-32`: findByAuthor
- `34-37`: findById
- `39-42`: search
- `44-47`: update
- `49-52`: delete

#### Key detail

The important decision is at `49-52`: service deletion calls repository `softDelete()`.  
So the service expresses the application rule "deleting an article means soft delete".

---

### `src/Service/SavedArticleService.php`

#### Why this file is necessary

It creates a stable business layer for saved articles, even though the current implementation is intentionally thin.

#### Main lines

- `14-17`: save
- `19-22`: isSaved
- `24-27`: findSavedId
- `29-32`: findByUser
- `34-37`: unsave

#### Why it still matters

Even when a service mostly forwards calls, it is useful because future business rules can be added without changing controllers.

---

### `src/Service/SubscriptionService.php`

#### Why this file is necessary

This file keeps subscription workflows separated from controllers.

#### Main lines

- `14-17`: create
- `19-22`: findByUser
- `24-27`: findById
- `29-32`: update
- `34-37`: delete

#### Functionality

At the moment it is a pass-through service, but it enforces the layered architecture consistently.

---

### `src/Service/CommunityService.php`

#### Why this file is necessary

This is the most important service in the project because community behavior has many business rules that should not live in SQL or raw controller code.

#### Main lines

- `15-24`: create validation
- `26-29`: creator membership helper
- `31-54`: simple read/join/leave delegations
- `56-64`: message decoration with `isMine`
- `66-86`: send community message
- `88-101`: membership and premium checks
- `103-110`: thread list access control
- `112-145`: create thread rules
- `147-161`: delete thread rules
- `163-178`: get thread messages rules
- `180-210`: send thread message rules

#### Business logic details

###### `create()` at `15-24`

Validates community name and description before insertion.

###### `findMessages()` at `56-64`

This decorates messages with:

- `isMine`

That is business/response logic, not SQL logic, so the service layer is the right place.

###### `sendMessage()` at `66-86`

This method:

- validates IDs and message text;
- delegates insertion;
- builds the response payload including `userName`, `createdAt`, and `isMine`.

###### `findThreads()` at `103-110`

Blocks thread access for non-members.

###### `createThread()` at `112-145`

Contains multiple rules:

- IDs and title must be valid;
- title length must pass `Validator::validateThreadTitle()`;
- user must be a member;
- user must be premium.

This is exactly the kind of logic services are supposed to hold.

###### `deleteThread()` at `147-161`

Also enforces:

- valid IDs;
- membership;
- premium status.

###### `findThreadMessages()` and `sendThreadMessage()` at `163-210`

These enforce:

- valid request data;
- membership checks;
- thread existence checks;
- consistent response formatting.

---

### `src/Service/RouteRegistry.php`

#### Why this file is necessary

This file is a small centralized route index.  
It is useful as a registry of:

- important web entry points;
- important API endpoints.

#### Main lines

- `8-24`: `RouteRegistry::all()`

#### Why it matters

Even though it is small, it helps document the application surface and can later support routing, diagnostics, or documentation generation.

---

## 7. Utility Layer

### `src/Utils/Env.php`

#### Why this file is necessary

This file is necessary so the app can read environment variables from a local `.env` file and from process variables consistently.

#### Main lines

- `4-42`: `loadEnvFile()`
- `44-54`: `env()`

#### Functionality

###### `loadEnvFile()` at `4-42`

- loads `.env` only once through static `$loaded`;
- ignores empty lines and comments;
- splits `NAME=VALUE`;
- stores values in both `$_ENV` and the process environment.

###### `env()` at `44-54`

Returns a variable value or a default.  
This makes all configuration code simpler and safer.

---

### `src/Utils/Validator.php`

#### Why this file is necessary

This file centralizes common validation rules.  
Without it, the same checks would be duplicated across services and controllers.

#### Main lines

- `8-11`: `validateName()`
- `13-16`: `validateEmail()`
- `18-21`: `validatePassword()`
- `23-26`: `validateThreadTitle()`

#### Functionality

- names must be at least 2 characters;
- emails must be valid;
- passwords must be at least 6 characters;
- thread titles must be at most 180 characters.

The service layer depends on this file heavily for business guards.

---

## 8. Controller Layer

Controllers in this project are mostly compatibility wrappers around services and repositories.  
They are necessary because much of the existing application still uses procedural function calls and direct PHP entry scripts.

---

### Common controller pattern

Several controllers follow the same structure:

1. require dependencies;
2. create one memoized repository accessor;
3. create one memoized service accessor if needed;
4. expose procedural helper functions for legacy callers.

This pattern is visible in:

- `ArticleController.php`
- `SavedArticleController.php`
- `SubscriptionController.php`
- `UserController.php`
- `CommunityMemberController.php`

The memoization block:

```php
static $instances = [];
$key = spl_object_id($cnx);
```

exists so one PDO object gets one repository/service instance per request.

---

### `src/Controller/UserController.php`

#### Why this file is necessary

It bridges legacy procedural calls such as `AddUser()` and `ConnectUser()` to the new repository/service architecture.

#### Main lines

- `12-21`: `userRepository()`
- `23-32`: `authService()`
- `34-37`: `AddUser()`
- `39-47`: user listing and search helpers
- `49-52`: `ConnectUser()`
- `54-77`: user lookups, update, delete, premium upgrade

#### Functionality

- repository is used for CRUD;
- `ConnectUser()` uses `AuthService` because login is business logic, not plain SQL;
- `upgradeToPremium()` also uses `AuthService`.

This controller is important because many older files can keep using legacy helper names without knowing that repositories and services now exist underneath.

---

### `src/Controller/ArticleController.php`

#### Why this file is necessary

It provides backward-compatible procedural article operations while using the new `ArticleService` and `ArticleRepository`.

#### Main lines

- `11-20`: `articleRepository()`
- `22-31`: `articleService()`
- `33-75`: CRUD and search helpers

#### Important design detail

`addArticle()` at `38-41` is an alias of `createArticle()`.  
That keeps older callers working without duplicating logic.

---

### `src/Controller/SavedArticleController.php`

#### Why this file is necessary

It is the procedural access layer for saved article features.

#### Main lines

- `11-20`: repository accessor
- `22-31`: service accessor
- `33-55`: save, check, lookup, list, unsave helpers

#### Functionality

This file is intentionally thin.  
Its role is adaptation, not business logic.

---

### `src/Controller/SubscriptionController.php`

#### Why this file is necessary

It exposes subscription functions to procedural callers while keeping persistence and logic in lower layers.

#### Main lines

- `11-20`: repository accessor
- `22-31`: service accessor
- `33-61`: CRUD helper functions

#### Important note

`addSubscription()` at `38-41` is a compatibility alias of `createSubscription()`.

---

### `src/Controller/CommunityMemberController.php`

#### Why this file is necessary

It offers direct procedural CRUD access to `communitymember` records.

#### Main lines

- `9-18`: repository accessor
- `20-42`: CRUD helper functions
- `45-47`: `hydrateCommunityMember()`

#### Why it matters

Even though `CommunityRepository` handles high-level community workflows, direct member CRUD still has a dedicated controller surface.

---

### `src/Controller/CommunityController.php`

#### Why this file is necessary

This is the main HTTP-facing controller for community features.  
It is necessary because the community module includes:

- direct AJAX-style JSON endpoints;
- request-body parsing;
- session-aware user resolution;
- router behavior based on `action`.

#### Main lines

- `4-5`: error display disabled for clean JSON output
- `15-35`: repository and service accessors
- `37-46`: JSON request reader
- `48-93`: request user resolution
- `95-291`: action handlers
- `293-357`: in-file router

#### Important functionality

###### `readJsonInput()` at `37-46`

Reads `php://input`, and when running in CLI tests it falls back to `IBLOG_TEST_REQUEST_BODY`.  
That is why controller tests can simulate HTTP JSON locally.

###### `resolveRequestUserId()` at `48-93`

This is a critical helper:

- starts session if needed;
- accepts `userId`;
- accepts `userEmail`;
- validates email;
- resolves email to user ID;
- rejects mismatched `userId` and `userEmail`;
- falls back to session user if no explicit identity was provided.

This function protects community endpoints from ambiguous identity input.

###### Action handlers at `95-291`

Each action:

- sets JSON header;
- reads request data;
- validates input;
- calls `CommunityService`;
- echoes a JSON payload.

Important examples:

- `createCommunityAction()` at `95-131`
  validates login, premium status, and required fields.
- `joinCommunityAction()` at `146-163`
  validates membership request inputs.
- `sendMessageAction()` at `201-225`
  validates message data and returns a full message payload.
- `createThreadAction()` at `249-258`
  delegates complex rules to `CommunityService`.

###### Router block at `293-357`

This block turns the file into a direct endpoint when it is requested as a script:

- checks DB connection;
- reads `$_GET['action']`;
- dispatches to the matching action;
- returns 404 for unknown action;
- returns 500 with JSON on exceptions.

This block is necessary because this controller is used as an actual API entry point, not only as an imported helper file.

---

## 9. Legacy Backend Entry Files

The refactor moved the main architecture into `src/`, but the application still contains older browser-facing entry files in `backend/controller/`.  
These files are still necessary because parts of the UI and some older scripts still point to them directly.

### Thin compatibility wrappers

These files are intentionally small:

- `backend/controller/ArticleController.php`
- `backend/controller/CommunityController.php`
- `backend/controller/CommunityMemberController.php`
- `backend/controller/SavedArticleController.php`
- `backend/controller/SubscriptionController.php`
- `backend/controller/UserController.php`

#### Why they are necessary

They preserve the old entry paths while delegating immediately to the new `src/Controller/...` files.

#### Main pattern

Each wrapper is essentially:

```php
require_once dirname(__DIR__, 2) . '/src/Controller/SomeController.php';
```

That means:

- old includes and routes still work;
- the real logic lives only once in `src/Controller`;
- migration risk is reduced.

### `backend/controller/add_article.php`

#### Why this file is necessary

This is a legacy form-handling entry point for article creation from the browser UI.

#### What it does

- starts the session;
- loads database and controller dependencies;
- checks whether the user is authenticated;
- resolves the user ID from session email if needed;
- enforces POST-only behavior;
- handles cover image upload or image data normalization;
- finally uses the article layer to save the article.

#### Architectural note

This file is older and more procedural than the new `src` files.  
Its continued existence is mainly for UI compatibility.

### `backend/controller/save_action.php`

#### Why this file is necessary

This is another legacy AJAX-style entry point used by the frontend save/unsave interaction.

#### What it does

- starts the session;
- loads database and saved-article controller dependencies;
- ensures the user is logged in;
- reads the action and article IDs from `$_POST`;
- dispatches to `saveArticle()` or `unsaveArticle()`;
- returns JSON.

#### Architectural note

This file still exists because it is a direct procedural endpoint, but the actual saved-article behavior is already delegated into the refactored controller/service/repository chain.

---

## 10. Testing Layer

The test layer is necessary because this architecture introduces several boundaries:

- database abstraction;
- controllers;
- repositories;
- services;
- endpoint behavior.

Tests verify that the boundaries really work.

---

### `phpunit.xml`

#### Why this file is necessary

This is the PHPUnit configuration file.  
Without it, the project would not have a stable automated test setup.

#### Main lines

- `2-8`: bootstrap, cache, colors, execution behavior
- `9-26`: coverage source configuration
- `27-40`: test suite directories

#### What it does

- loads `tests/bootstrap.php`;
- defines the files included in coverage;
- organizes test suites into `Unit`, `Integration`, `Performance`, and `Advanced`.

---

### `tests/bootstrap.php`

#### Why this file is necessary

This file sets up autoloading for tests and application classes.

#### Main lines

- `4-7`: use Composer autoload if available
- `8-28`: fallback manual autoloader

#### Why it matters

It allows tests to run even if Composer autoload is not the only loading mechanism available.

---

### `tests/Support/TestApplication.php`

#### Why this file is necessary

This is the central test infrastructure file.  
It is necessary because it:

- creates isolated MySQL test databases;
- resets schema and seed data before tests;
- can create either a local or HTTP web client;
- can auto-start a PHP built-in server when needed.

#### Most important parts

- `18-31`: runtime directory management
- `33-49`: database name and DSN helpers
- `57-89`: admin/database PDO creation
- `64-71`: DB reset
- `80-132`: base URL and client creation
- `134-157`: server readiness checks
- `173-185`: test env bootstrapping
- `187-304`: server spawning and shutdown
- `306-398`: schema creation
- `400-415`: schema drop
- `417-526`: base seed data

#### Why it is architecturally important

This file makes the whole suite deterministic.  
All controller, functional, and integration tests depend on it.

---

### `tests/Support/WebClient.php`

#### Why this file is necessary

This file abstracts test HTTP requests.  
It is necessary because the project runs tests in two possible ways:

1. through real HTTP/cURL;
2. through a local PHP request runner.

#### Main lines

- `22-30`: GET requests
- `32-40`: JSON POST requests
- `42-55`: form POST requests
- `57-102`: real HTTP request flow
- `104-160`: local request flow
- `162-174`: coverage append logic
- `176-221`: headers and cookies handling
- `224-241`: `HttpResponse`

#### Why it matters

The local request mode is especially important for coverage collection because it can execute endpoint files while still feeding coverage data back into PHPUnit.

---

### `tests/Support/local_request.php`

#### Why this file is necessary

This file simulates an HTTP request inside a separate PHP process when tests run locally.

#### Main lines

- `4-20`: read and validate request payload
- `22-28`: configure test session directory
- `30-33`: start Xdebug coverage when enabled
- `47-67`: populate `$_GET`, `$_POST`, and `$_REQUEST`
- `69-75`: restore session and request body
- `77-105`: capture output, headers, session cookie, and coverage
- `107`: require the target PHP file

#### Why it is clever

It transforms a file-based script into something testable like an HTTP endpoint, while still preserving session and code coverage behavior.

---

### `tests/Support/EndpointTestCase.php`

#### Why this file is necessary

It is the shared base class for endpoint-style tests.

#### Main lines

- `13-18`: reset DB and create the client before each test
- `20-23`: provide direct PDO access
- `25-38`: helper sign-in workflow

#### Value

This file eliminates repeated setup code across controller, integration, and functional tests.

---

### `tests/Unit/ControllerCoverageTest.php`

#### Why this file is necessary

This file directly exercises procedural controller helpers for:

- users,
- articles,
- saved articles.

It is especially important for coverage and for ensuring the compatibility wrappers still work.

#### Main lines

- `14-23`: user read/search coverage
- `25-42`: user create/delete coverage
- `44-67`: article list/search/delete coverage
- `69-84`: saved article save/duplicate/unsave coverage

---

### `tests/Unit/CommunityControllerCoverageTest.php`

#### Why this file is necessary

This file exists to verify the most complex controller in the project: `CommunityController.php`.

#### Main lines

- `12-24`: teardown reset
- `26-37`: identity resolution tests
- `39-129`: community creation, membership, and message action tests
- `131-251`: thread and router behavior tests
- `253-275`: helper to invoke controller actions with fake request bodies

#### Why it matters

This test file proves that:

- JSON actions work;
- membership rules work;
- premium restrictions work;
- the controller router handles bad actions correctly.

---

### `tests/Unit/RepositoryCoverageTest.php`

#### Why this file is necessary

This file was added to drive repository coverage into the target range and to verify edge branches that normal functional tests do not always hit.

#### Main lines

- `15-27`: article repository alternate schema coverage
- `29-40`: saved article repository alternate schema coverage
- `42-84`: user repository failure branch and subscription fallback coverage
- `86-173`: direct coverage for all public user repository methods
- `175-228`: MySQL-only premium expiry branch coverage
- `230-324`: helper schemas for isolated repository tests

#### Why it matters

This file is what closed the remaining coverage gap in `UserRepository`, especially:

- the MySQL-specific `DATE_ADD(...)` branch;
- missing-user failure paths;
- alternate avatar-source schema branches.

---

## 11. Why Some Old Files Became Unnecessary

The old project structure had pseudo-model files in `src/Repository` that mixed concerns and no longer fit the architecture.

Examples of removed unnecessary files:

- old `Article.php`
- old `Community.php`
- old `CommunityMember.php`
- old `CommunityMessage.php`
- old `SavedArticle.php`
- old `subscription.php`
- old `users.php`

### Why they became unnecessary

They were unnecessary because:

- repositories now hold SQL logic directly;
- services now hold business logic;
- controllers now expose procedural compatibility functions;
- hydration is done inside repositories when needed.

So the removed files were not adding architectural value anymore.

---

## 12. Final Architectural Assessment

### What is good in the current structure

- database handling is centralized;
- SQL is isolated in repositories;
- business rules are isolated in services;
- controllers are mostly thin adapters;
- legacy compatibility was preserved;
- tests cover repository branches and controller behavior well.

### What is intentionally hybrid

The application is not fully pure-OOP yet because some files still expose procedural functions.  
This is intentional for compatibility with the existing codebase.

The current design is therefore:

- cleaner than the old code,
- close to the professor architecture,
- practical for an existing PHP project that already had procedural entry points.

### The main architectural idea in one sentence

The refactor did not just move files into folders; it separated responsibilities so that:

- `Database` builds connections,
- `Repository` talks to SQL,
- `Service` applies rules,
- `Controller` handles requests,
- `Tests` verify the whole chain.

---

## 13. Short Layer Summary

### `config`

Defines how the application should run.

### `Database`

Creates and manages PDO connections plus DB helper functions.

### `Repository`

Contains SQL and converts rows into usable data structures.

### `Service`

Contains business rules and feature workflows.

### `Controller`

Receives request data and delegates to services/repositories.

### `Utils`

Contains shared helper logic.

### `tests`

Proves that the architecture actually works and remains stable.
