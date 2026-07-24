# RiverIQ Code Explanation

This document explains the RiverIQ codebase by feature, then maps every backend and frontend source file to its role. Use it as the main guide when you want to understand how a user action moves through the app.

## Project Shape

RiverIQ is split into two apps:

- `backend/`: Express API, MongoDB models, authentication, payments, file upload, poker hand parsers, and stat calculation.
- `frontend/`: React/Vite app, dashboard UI, auth screens, charts, reports, goals, settings, and API hooks.

The frontend talks to the backend through `/api/...` endpoints. The backend stores app data in MongoDB and keeps authentication in a JWT cookie.

## App Startup

### Backend Startup

`backend/src/server.js` is the backend entry point. It loads environment variables, connects to MongoDB through `config/db.js`, then starts the Express app on `process.env.PORT` or `5001`.

`backend/src/app.js` creates the Express app. It configures CORS from `FRONTEND_URL`, enables cookies with `cookieParser`, parses JSON bodies, mounts each route group, then adds the 404 and global error handlers.

### Frontend Startup

`frontend/src/main.jsx` mounts React into the DOM. It creates the TanStack Query client, wraps the app in `QueryClientProvider`, wraps Google auth in `GoogleOAuthProvider`, enables React Query Devtools, and mounts the Sonner toaster.

`frontend/src/App.jsx` defines all routes. Logged-out marketing/auth routes use the website navbar and footer. Logged-in dashboard routes are nested under `DashboardLayout`. Protected screens are wrapped in `ProtectedRoute`.

## Authentication

### Backend Auth Flow

Routes live in `backend/src/routes/authRoutes.js`. The route file connects HTTP endpoints to controller functions from `authController.js`.

`backend/src/controllers/authController.js` handles:

- Registering users.
- Logging in with email/password.
- Logging in with Google.
- Logging out.
- Fetching the current user.
- Updating preferences.
- Updating bankroll.
- Uploading/deleting avatars.
- Sending verify-email and reset-password emails.
- Verifying email tokens.
- Resetting passwords.
- Canceling subscriptions.

Passwords are hashed with `bcryptjs`. JWT cookies are created by `generateToken`. Email verification and password reset tokens are generated with `crypto`, stored hashed in MongoDB, and sent to the user by email.

`serializeUser` controls what user fields are returned to the frontend. This keeps sensitive fields, especially password and reset tokens, out of API responses.

`verifyGoogleCredential` validates the Google credential against Google’s token endpoint, checks the configured Google client ID, and only accepts verified Google emails.

`backend/src/middleware/authMiddleware.js` protects private routes. It reads the JWT cookie, verifies it, loads the user, and attaches the user to `req.user`.

`backend/src/utils/generateToken.js` signs the JWT and sets the auth cookie. Cookie settings are controlled by environment:

- `httpOnly` prevents browser JavaScript from reading the token.
- `secure` makes cookies HTTPS-only in production or when cross-site cookies are required.
- `sameSite` controls cross-site browser cookie behavior.

### Frontend Auth Flow

`frontend/src/api/authApi.js` contains the raw HTTP functions for auth. These functions call the backend using `fetch`, include credentials so cookies are sent, parse JSON, and throw useful errors when requests fail.

`frontend/src/hooks/useAuth.js` wraps those API functions in TanStack Query. It has one query, `['authUser']`, that asks the backend who the current user is. Mutations update this cache after login, register, preferences, bankroll, avatar, or subscription changes.

Important returned values from `useAuth`:

- `user`: the current user object.
- `loading`: whether the auth user query is still loading.
- `isAuthenticated`: true when a user exists.
- `isEmailVerified`: true when the user has verified email.
- `login`, `register`, `loginGoogle`, `logout`: auth actions.
- mutation loading flags such as `loginLoading`, `logoutLoading`, and `updateBankrollLoading`.

`frontend/src/utils/ProtectedRoute.jsx` blocks access to private screens when the user is logged out. If a logged-out user tries to reach protected dashboard/payment pages, they are redirected to login.

`frontend/src/pages/UserAuthPage.jsx` renders login, register, forgot-password, and Google sign-in UI depending on the route. It calls `useAuth` actions and shows field-level errors.

`frontend/src/pages/ResetPasswordPage.jsx` validates a reset token and lets the user submit a new password.

`frontend/src/pages/VerifyEmailPage.jsx` verifies email tokens and handles the “please verify your email” state.

## Dashboard Layout And Navigation

`frontend/src/components/DashboardLayout/DashboardLayout.jsx` is the logged-in shell. It renders the dashboard navbar, sidebar, and nested route outlet. Its CSS controls spacing so dashboard pages sit beside the sidebar and below the navbar.

`frontend/src/components/Navbar_dashboard/Navbar.jsx` is the dashboard navbar. It shows the RiverIQ brand area, new-session button, bankroll control, avatar, username, and user menu. Bankroll changes call `updateBankroll` through `useAuth`, and successful updates refresh the cached auth user.

`frontend/src/components/Sidebar/Sidebar.jsx` renders dashboard navigation. It uses `SidebarData.jsx` for nav items. It can lock items based on subscription/session state and route users to the right dashboard section.

`frontend/src/components/Sidebar/SidebarData.jsx` defines the dashboard menu items: Dashboard, Sessions, Analytics, Reports, Goals, Hand Charts, Help, and Settings.

## Sessions

### Backend Session Flow

Routes live in `backend/src/routes/sessionRoutes.js`. Session routes are protected by auth middleware and use upload middleware for hand history files.

`backend/src/controllers/sessionController.js` handles:

- `getSessions`: loads all sessions for the current user, optionally filtered by date period.
- `addSession`: validates the selected poker site and uploaded file, detects the true poker site from file text, parses hands, calculates stats, creates a Session document, and updates bankroll by session profit.
- `updateSession`: edits session title, notes, and tags.
- `deleteSession`: deletes the session and reverses its profit from bankroll.

The upload flow stores hand history metadata in `handHistory`. If R2 upload middleware ran, the session stores the R2 metadata. Otherwise it stores local upload metadata from the request file.

### Frontend Session Flow

`frontend/src/api/sessionApi.js` calls the session API. It normalizes backend sessions into the shape the UI expects, especially fields like `hands`, `profit`, `bb100`, dates, and metadata.

`frontend/src/hooks/useSessions.js` wraps session API calls:

- `useSessions` fetches sessions with a period filter.
- `useAddSession` uploads a session and updates the sessions cache plus bankroll user cache.
- `useUpdateSession` updates title/notes/tags and refreshes session caches.
- `useDeleteSession` deletes a session and updates sessions plus bankroll cache.

`frontend/src/pages/AddSessionPage.jsx` is the upload screen. It collects poker site, session title, notes, tags, and the hand history file. It sends a `FormData` request through `useAddSession`.

`frontend/src/pages/SessionsPage.jsx` is the main sessions list page. It includes filters, the upload button, and `SessionsTable`.

`frontend/src/components/SessionsTable/SessionsTable.jsx` renders the session list. It supports filtering, actions, edit/delete menus, the locked stats button for non-Pro users, and links to details/stats.

`frontend/src/components/SessionsTable/SessionToolbar.jsx` renders the filter controls above the table.

`frontend/src/components/SessionsTable/sessionTableFilters.js` contains pure helper logic for filtering and sorting sessions.

`frontend/src/pages/SessionDetailPage.jsx` shows and edits one session’s metadata, including editable session title.

`frontend/src/pages/SessionStatsPage.jsx` shows one session’s detailed stats, including position summaries, hand chart summaries, and 3bet-vs-open summaries.

## Poker Hand Parsing

Each parser converts raw text hand histories into a shared normalized hand object shape. Then the stats layer calculates analytics from those normalized hands.

Supported parser wrappers:

- `backend/src/utils/parsers/pokerstars/wrapper.js`
- `backend/src/utils/parsers/ggpoker/wrapper.js`
- `backend/src/utils/parsers/888poker/wrapper.js`
- `backend/src/utils/parsers/partypoker/wrapper.js`

Each parser has a matching `regex.js` file containing site-specific regular expressions.

`backend/src/utils/parsers/parser.js` contains shared parsing logic used by site wrappers. It extracts table data, seats, blinds, hole cards, board cards, streets, actions, showdown info, and results.

Parser helpers:

- `helpers/amounts.js`: parses and normalizes money amounts.
- `helpers/parseStreet.js`: reads actions for a single street.
- `helpers/parseActions.js`: parses betting actions into normalized action objects.
- `helpers/parseShowdownActions.js`: parses showdown/showdown-like summary information.
- `helpers/parseSummarySeat.js`: reads final seat summaries.

`backend/src/utils/parsers/info.md` documents parser notes.

`backend/src/utils/parsers/testParser.js` is a local parser test/debug script.

## Poker Stats

`backend/src/utils/parsers/stats/calculateStats.js` is the stats aggregator. It calls the individual stat functions, combines basic stats, builds position-level stats, builds hand chart data, and builds 3bet-vs-open matrices.

Individual stat files:

- `getHandsPlayed.js`: total parsed hands.
- `getProfit.js`: total money won/lost.
- `getAllInEV.js`: all-in adjusted profit.
- `getBB100.js`: big blinds won per 100 hands.
- `getVPIP.js`: voluntarily put money in pot percentage.
- `getPFR.js`: preflop raise percentage.
- `getThreeBet.js`: 3bet frequency.
- `getFoldToThreeBet.js`: fold to 3bet frequency.
- `getFourBet.js`: 4bet frequency.
- `getFoldToFourBet.js`: fold to 4bet frequency.
- `getSteal.js`: steal attempt frequency.
- `getCBet.js`: continuation bet frequency.
- `getFoldToCBet.js`: fold to continuation bet frequency.
- `getTurnCBet.js`: turn continuation bet frequency.
- `getFoldToTurnCBet.js`: fold to turn c-bet frequency.
- `getWTSD.js`: went to showdown percentage.
- `getWMSD.js`: won money at showdown percentage.
- `getAF.js`: aggression factor.
- `getHandsByPosition.js`: matrix of starting hands by position.
- `getThreeBetVsOpen.js`: 3bet-vs-open opportunities and results.

These backend stats are stored on each `Session` document. The frontend then aggregates sessions for dashboards, reports, analytics, goals, and hand charts.

## Analytics

`frontend/src/pages/AnalyticsPage.jsx` aggregates session stats by position and overall. It weights session stats by hand count so larger sessions matter more than smaller sessions. It renders overall stat groups and position breakdowns.

`frontend/src/utils/analytics/statKeys.js` defines the stat keys and labels used by analytics.

`frontend/src/utils/analytics/positions.js` defines position order and labels.

`frontend/src/utils/analytics/datePeriods.js` defines date period options.

`frontend/src/utils/analytics/helpers.js` contains reusable formatting and aggregation helpers.

`frontend/src/utils/analytics/positionGoalRanges.js` stores goal ranges for position-based analytics.

`frontend/src/pages/AnalyticsPage.css` styles the analytics page.

## Dashboard Home

`frontend/src/pages/DashboardPage.jsx` is the logged-in home page. It fetches sessions, applies date filters, and renders stat cards plus the main profit chart.

`frontend/src/pages/DashboardSectionPage.jsx` is a generic dashboard section wrapper/page used for dashboard navigation sections.

`frontend/src/components/StatCards/StatCards.jsx` renders dashboard metric cards.

`frontend/src/components/StatCards/StatCardsData.jsx` calculates the values shown in those cards, including profit, win rate, hands, and sessions.

`frontend/src/components/ProfitChart/ProfitChart.jsx` renders the main line chart. It builds chart points from sessions, formats tooltips, supports metrics like profit, all-in EV, BB won, BB/100, and hourly profit, and controls locked overlays for Pro-only details.

`frontend/src/utils/filterSessions.js` filters sessions by period.

`frontend/src/utils/Stats.jsx` contains shared stat calculations used by dashboard-style UI.

## Reports

`frontend/src/pages/ReportsPage.jsx` is the report builder. It lets users choose filters, groupings, columns, and date ranges, then builds report rows from sessions.

`frontend/src/pages/SavedReportsPage.jsx` displays saved report configurations and summary tables.

`frontend/src/utils/reports/reportData.js` defines report column metadata and transforms sessions into reportable rows.

`backend/src/routes/savedReportRoutes.js` defines saved-report API routes.

`backend/src/controllers/savedReportController.js` creates, reads, updates, and deletes saved report definitions for the current user.

`backend/src/models/SavedReport.js` defines the MongoDB schema for saved report configuration.

## Goals

`frontend/src/pages/GoalsPage.jsx` renders goal tracking. It compares player stats against goal ranges and displays progress.

`backend/src/routes/goalRoutes.js` defines goal API routes.

`backend/src/controllers/goalController.js` handles CRUD for user goals.

`backend/src/models/Goal.js` defines the goal schema.

`frontend/src/api/goalApi.js` contains frontend HTTP functions for goals.

`frontend/src/hooks/useGoals.js` wraps goal API calls with TanStack Query.

## Hand Charts

`frontend/src/pages/HandChartsPage.jsx` renders recommended and actual hand charts. It reads hand chart data from `session.stats.handsByPosition`, aggregates it by position, and displays actual play frequencies once enough hands are uploaded.

`ACTUAL_HAND_CHART_UNLOCK_HANDS` controls the unlock threshold. It is currently `5000`.

`frontend/src/pages/HandChartsPage.css` styles the hand matrix, controls, locked overlay, and detail display.

The backend source for actual hand chart data is `backend/src/utils/parsers/stats/getHandsByPosition.js`. That stat function counts dealt, played, called, limped, open-raised, raised, and folded outcomes for starting hands by position.

## Settings

`frontend/src/pages/SettingsPage.jsx` renders profile, preferences, password reset, avatar, import guidance, subscription, and save controls.

Settings calls backend auth endpoints through `useAuth`, mostly `updatePreferences`, `uploadAvatar`, `deleteAvatar`, `forgotPassword`, `cancelSubscription`, and `updateBankroll`.

`frontend/src/utils/dateRangePreferences.js` stores date-range preference defaults and helpers.

`frontend/src/pages/SettingsPage.css` styles the settings panels and forms.

## Payments And Subscription

`frontend/src/pages/PricingPage.jsx` shows the product pricing page and sends logged-out users to login when they try to start a subscription.

`frontend/src/pages/PaymentPage.jsx` renders Stripe payment flow inside the Stripe `Elements` provider from `App.jsx`.

`backend/src/routes/paymentRoutes.js` defines payment endpoints.

`backend/src/controllers/paymentController.js` creates payment/subscription sessions or intents and updates subscription-related data.

`backend/src/config/stripe.js` initializes Stripe with backend credentials.

Subscription state is stored on the `User` model and returned to the frontend through `serializeUser`.

## Website And Help Pages

Marketing/legal/help pages:

- `frontend/src/pages/FeaturePage.jsx`
- `frontend/src/pages/PricingPage.jsx`
- `frontend/src/pages/AboutPage.jsx`
- `frontend/src/pages/FaqPage.jsx`
- `frontend/src/pages/InfoPage.jsx`
- `frontend/src/pages/TermsPage.jsx`
- `frontend/src/pages/PrivacyPage.jsx`
- `frontend/src/pages/NewUserPage.jsx`

`InfoPage.jsx` is the logged-in help center. It includes hand history upload sections for PokerStars, GGPoker, 888poker, and related help topics.

`NewUserPage.jsx` is the empty/no-sessions dashboard experience and links users toward upload/help flows.

`frontend/src/assets/feature-grid.jsx` provides content for feature cards on marketing pages.

## Reusable UI

`frontend/src/components/Navbar/Navbar.jsx` is the public website navbar.

`frontend/src/components/WebsiteFooter/WebsiteFooter.jsx` is the public website footer.

`frontend/src/components/LoadingScreen/LoadingScreen.jsx` renders the RiverIQ loader.

`frontend/src/components/ProgressBar/ProgressBar.jsx` renders reusable progress bars.

`frontend/src/components/Card/Card.jsx` is a small reusable card wrapper.

Every matching `.css` file styles the component or page with the same base name.

## Database Models

`backend/src/models/User.js` stores user account data: username, email, hashed password, subscription, bankroll, preferences, email verification fields, reset password fields, avatar fields, and role.

`backend/src/models/Session.js` stores uploaded poker sessions, file metadata, table metadata, notes/tags, duration, and nested stats.

`backend/src/models/Goal.js` stores user-created goals.

`backend/src/models/SavedReport.js` stores saved report configurations.

## Uploads And Cloud Storage

`backend/src/middleware/uploadMiddleware.js` handles multipart file uploads in memory.

`backend/src/middleware/uploadToR2Middleware.js` uploads hand histories and avatars to Cloudflare R2 and exposes helpers to delete R2 objects.

R2 is used so uploaded files/assets can be stored outside the app server. For hand histories, it preserves source files for reprocessing/debugging. For avatars, it gives users stable hosted image URLs.

## Error Handling

`backend/src/middleware/errorMiddleware.js` contains:

- `notFound`: handles unknown API routes.
- `globalErrorHandler`: returns consistent JSON for thrown/passed errors.

Controllers call `next(error)` so the global error handler can format the response.

## Scripts And Fixtures

`backend/src/scripts/backfillSessionDuration.js` reparses stored hand history files and fills missing session duration.

`backend/src/scripts/backfillHandsByPosition.js` reparses stored hand histories and fills missing hand chart data.

`backend/src/data/dummy-sessions-with-hand-charts.json` is seed/demo session data.

Parser fixture folders under `backend/src/utils/parsers/fixtures/` contain sample hand history files and generated session JSON used for testing parser/stat behavior.

## Backend File Index

### Backend App And Config

- `backend/src/server.js`: connects to the database and starts the API server.
- `backend/src/app.js`: creates Express app, middleware, routes, and error handlers.
- `backend/src/config/env.js`: loads environment configuration.
- `backend/src/config/db.js`: connects to MongoDB.
- `backend/src/config/stripe.js`: initializes Stripe.
- `backend/package.json`: backend scripts and dependencies.
- `backend/package-lock.json`: locked dependency versions.

### Backend Routes

- `backend/src/routes/authRoutes.js`: auth, user, avatar, password, preferences, bankroll, and subscription routes.
- `backend/src/routes/sessionRoutes.js`: session list/upload/update/delete routes.
- `backend/src/routes/paymentRoutes.js`: payment/subscription routes.
- `backend/src/routes/goalRoutes.js`: goal routes.
- `backend/src/routes/savedReportRoutes.js`: saved report routes.

### Backend Controllers

- `backend/src/controllers/authController.js`: all auth/user-account behavior.
- `backend/src/controllers/sessionController.js`: session upload, parsing, CRUD, bankroll side effects.
- `backend/src/controllers/paymentController.js`: Stripe/payment behavior.
- `backend/src/controllers/goalController.js`: goal CRUD behavior.
- `backend/src/controllers/savedReportController.js`: saved report CRUD behavior.

### Backend Middleware

- `backend/src/middleware/authMiddleware.js`: protects routes by verifying JWT cookies.
- `backend/src/middleware/errorMiddleware.js`: API error formatting and 404s.
- `backend/src/middleware/uploadMiddleware.js`: parses uploaded files.
- `backend/src/middleware/uploadToR2Middleware.js`: sends uploads to Cloudflare R2.

### Backend Models And Utils

- `backend/src/models/User.js`: user schema.
- `backend/src/models/Session.js`: session/stat schema.
- `backend/src/models/Goal.js`: goal schema.
- `backend/src/models/SavedReport.js`: saved report schema.
- `backend/src/utils/generateToken.js`: JWT creation and cookie options.

### Backend Parsers

- `backend/src/utils/parsers/parser.js`: shared hand parser.
- `backend/src/utils/parsers/pokerstars/regex.js`: PokerStars patterns.
- `backend/src/utils/parsers/pokerstars/wrapper.js`: PokerStars parser wrapper.
- `backend/src/utils/parsers/ggpoker/regex.js`: GGPoker patterns.
- `backend/src/utils/parsers/ggpoker/wrapper.js`: GGPoker parser wrapper.
- `backend/src/utils/parsers/888poker/regex.js`: 888poker patterns.
- `backend/src/utils/parsers/888poker/wrapper.js`: 888poker parser wrapper.
- `backend/src/utils/parsers/partypoker/regex.js`: partypoker patterns.
- `backend/src/utils/parsers/partypoker/wrapper.js`: partypoker parser wrapper.
- `backend/src/utils/parsers/helpers/amounts.js`: amount parsing.
- `backend/src/utils/parsers/helpers/parseActions.js`: action parsing.
- `backend/src/utils/parsers/helpers/parseShowdownActions.js`: showdown parsing.
- `backend/src/utils/parsers/helpers/parseStreet.js`: street parsing.
- `backend/src/utils/parsers/helpers/parseSummarySeat.js`: summary-seat parsing.
- `backend/src/utils/parsers/info.md`: parser notes.
- `backend/src/utils/parsers/testParser.js`: local parser debug runner.

### Backend Stats

- `backend/src/utils/parsers/stats/calculateStats.js`: combines every stat into one object.
- `backend/src/utils/parsers/stats/getAF.js`: aggression factor.
- `backend/src/utils/parsers/stats/getAllInEV.js`: all-in EV.
- `backend/src/utils/parsers/stats/getBB100.js`: BB/100.
- `backend/src/utils/parsers/stats/getCBet.js`: c-bet.
- `backend/src/utils/parsers/stats/getFoldToCBet.js`: fold to c-bet.
- `backend/src/utils/parsers/stats/getFoldToFourBet.js`: fold to 4bet.
- `backend/src/utils/parsers/stats/getFoldToThreeBet.js`: fold to 3bet.
- `backend/src/utils/parsers/stats/getFoldToTurnCBet.js`: fold to turn c-bet.
- `backend/src/utils/parsers/stats/getFourBet.js`: 4bet.
- `backend/src/utils/parsers/stats/getHandsByPosition.js`: actual hand chart data.
- `backend/src/utils/parsers/stats/getHandsPlayed.js`: hand count.
- `backend/src/utils/parsers/stats/getPFR.js`: preflop raise.
- `backend/src/utils/parsers/stats/getProfit.js`: profit.
- `backend/src/utils/parsers/stats/getSteal.js`: steal.
- `backend/src/utils/parsers/stats/getThreeBet.js`: 3bet.
- `backend/src/utils/parsers/stats/getThreeBetVsOpen.js`: 3bet-vs-open matrix.
- `backend/src/utils/parsers/stats/getTurnCBet.js`: turn c-bet.
- `backend/src/utils/parsers/stats/getVPIP.js`: VPIP.
- `backend/src/utils/parsers/stats/getWMSD.js`: won money at showdown.
- `backend/src/utils/parsers/stats/getWTSD.js`: went to showdown.

### Backend Scripts And Data

- `backend/src/scripts/backfillHandsByPosition.js`: fills historical hand chart data.
- `backend/src/scripts/backfillSessionDuration.js`: fills historical duration data.
- `backend/src/data/dummy-sessions-with-hand-charts.json`: demo/seed sessions.

## Frontend File Index

### Frontend App

- `frontend/src/main.jsx`: React root, Query client, Google OAuth, toaster, devtools.
- `frontend/src/App.jsx`: routes, auth redirects, dashboard shell, Stripe Elements.
- `frontend/src/index.css`: global styles and theme defaults.
- `frontend/package.json`: frontend scripts and dependencies.
- `frontend/package-lock.json`: locked dependency versions.
- `frontend/vite.config.js`: Vite config.
- `frontend/jsconfig.json`: JS path/config settings.
- `frontend/README.md`: Vite/React readme.

### Frontend APIs And Hooks

- `frontend/src/api/authApi.js`: auth/user HTTP requests.
- `frontend/src/api/sessionApi.js`: session HTTP requests and session normalization.
- `frontend/src/api/goalApi.js`: goal HTTP requests.
- `frontend/src/api/savedReportApi.js`: saved report HTTP requests.
- `frontend/src/hooks/useAuth.js`: auth query/mutations and cached user state.
- `frontend/src/hooks/useSessions.js`: session query/mutations and session cache updates.
- `frontend/src/hooks/useGoals.js`: goal query/mutations.
- `frontend/src/hooks/useSavedReports.js`: saved report query/mutations.

### Frontend Utilities

- `frontend/src/utils/ProtectedRoute.jsx`: protected route guard.
- `frontend/src/utils/Stats.jsx`: shared dashboard stat calculations.
- `frontend/src/utils/filterSessions.js`: date/session filters.
- `frontend/src/utils/dateRangePreferences.js`: date-range preference helpers.
- `frontend/src/utils/analytics/datePeriods.js`: analytics period options.
- `frontend/src/utils/analytics/helpers.js`: analytics formatting and aggregation helpers.
- `frontend/src/utils/analytics/positionGoalRanges.js`: position goal ranges.
- `frontend/src/utils/analytics/positions.js`: position labels/order.
- `frontend/src/utils/analytics/statKeys.js`: analytics stat metadata.
- `frontend/src/utils/reports/reportData.js`: report columns and row transforms.

### Frontend Components

- `frontend/src/components/Card/Card.jsx`: reusable card component.
- `frontend/src/components/Card/Card.css`: card styling.
- `frontend/src/components/DashboardLayout/DashboardLayout.jsx`: logged-in shell.
- `frontend/src/components/DashboardLayout/DashboardLayout.css`: shell layout styling.
- `frontend/src/components/LoadingScreen/LoadingScreen.jsx`: RiverIQ loader.
- `frontend/src/components/LoadingScreen/LoadingScreen.css`: loader styling.
- `frontend/src/components/Navbar/Navbar.jsx`: public navbar.
- `frontend/src/components/Navbar/Navbar.css`: public navbar styling.
- `frontend/src/components/Navbar_dashboard/Navbar.jsx`: dashboard navbar.
- `frontend/src/components/Navbar_dashboard/Navbar.css`: dashboard navbar styling.
- `frontend/src/components/ProfitChart/ProfitChart.jsx`: dashboard profit chart.
- `frontend/src/components/ProfitChart/ProfitChart.css`: chart styling.
- `frontend/src/components/ProgressBar/ProgressBar.jsx`: progress bar UI.
- `frontend/src/components/ProgressBar/ProgressBar.css`: progress styling.
- `frontend/src/components/SessionsTable/SessionsTable.jsx`: sessions table.
- `frontend/src/components/SessionsTable/SessionsTable.css`: sessions table styling.
- `frontend/src/components/SessionsTable/SessionToolbar.jsx`: sessions filter toolbar.
- `frontend/src/components/SessionsTable/sessionTableFilters.js`: table filter logic.
- `frontend/src/components/Sidebar/Sidebar.jsx`: dashboard sidebar.
- `frontend/src/components/Sidebar/Sidebar.css`: sidebar styling.
- `frontend/src/components/Sidebar/SidebarData.jsx`: sidebar nav data.
- `frontend/src/components/StatCards/StatCards.jsx`: metric cards.
- `frontend/src/components/StatCards/StatCards.css`: metric card styling.
- `frontend/src/components/StatCards/StatCardsData.jsx`: metric card data calculations.
- `frontend/src/components/WebsiteFooter/WebsiteFooter.jsx`: public footer.
- `frontend/src/components/WebsiteFooter/WebsiteFooter.css`: public footer styling.

### Frontend Pages

- `frontend/src/pages/AboutPage.jsx`: about page.
- `frontend/src/pages/AboutPage.css`: about page styling.
- `frontend/src/pages/AddSessionPage.jsx`: session upload page.
- `frontend/src/pages/AddSessionPage.css`: upload page styling.
- `frontend/src/pages/AnalyticsPage.jsx`: analytics page.
- `frontend/src/pages/AnalyticsPage.css`: analytics page styling.
- `frontend/src/pages/DashboardPage.jsx`: dashboard home page.
- `frontend/src/pages/DashboardPage.css`: dashboard home styling.
- `frontend/src/pages/DashboardSectionPage.jsx`: generic dashboard section page.
- `frontend/src/pages/FaqPage.jsx`: FAQ page.
- `frontend/src/pages/FaqPage.css`: FAQ styling.
- `frontend/src/pages/FeaturePage.jsx`: public features page.
- `frontend/src/pages/FeaturePage.css`: feature page styling.
- `frontend/src/pages/GoalsPage.jsx`: goals page.
- `frontend/src/pages/GoalsPage.css`: goals styling.
- `frontend/src/pages/HandChartsPage.jsx`: hand charts page.
- `frontend/src/pages/HandChartsPage.css`: hand charts styling.
- `frontend/src/pages/InfoPage.jsx`: help center.
- `frontend/src/pages/InfoPage.css`: help center styling.
- `frontend/src/pages/NewUserPage.jsx`: no-session first-user screen.
- `frontend/src/pages/NewUserPage.css`: no-session styling.
- `frontend/src/pages/PaymentPage.jsx`: subscription payment page.
- `frontend/src/pages/PaymentPage.css`: payment styling.
- `frontend/src/pages/PricingPage.jsx`: pricing page.
- `frontend/src/pages/PricingPage.css`: pricing styling.
- `frontend/src/pages/PrivacyPage.jsx`: privacy page.
- `frontend/src/pages/PrivacyPage.css`: privacy styling.
- `frontend/src/pages/ReportsPage.jsx`: report builder page.
- `frontend/src/pages/ReportsPage.css`: report builder styling.
- `frontend/src/pages/ResetPasswordPage.jsx`: password reset page.
- `frontend/src/pages/ResetPasswordPage.css`: reset password styling.
- `frontend/src/pages/SavedReportsPage.jsx`: saved reports page.
- `frontend/src/pages/SavedReportsPage.css`: saved reports styling.
- `frontend/src/pages/SessionDetailPage.jsx`: single session detail/edit page.
- `frontend/src/pages/SessionDetailPage.css`: session detail styling.
- `frontend/src/pages/SessionsPage.jsx`: sessions list page.
- `frontend/src/pages/SessionsPage.css`: sessions page styling.
- `frontend/src/pages/SessionStatsPage.jsx`: single-session stats page.
- `frontend/src/pages/SessionStatsPage.css`: session stats styling.
- `frontend/src/pages/SettingsPage.jsx`: settings page.
- `frontend/src/pages/SettingsPage.css`: settings styling.
- `frontend/src/pages/TermsPage.jsx`: terms page.
- `frontend/src/pages/TermsPage.css`: terms styling.
- `frontend/src/pages/UserAuthPage.jsx`: login/register/forgot-password page.
- `frontend/src/pages/UserAuthPage.css`: auth page styling.
- `frontend/src/pages/VerifyEmailPage.jsx`: email verification page.
- `frontend/src/pages/VerifyEmailPage.css`: verify email styling.

### Frontend Assets

- `frontend/src/assets/feature-grid.jsx`: data used to render public feature content.

## Reading The Main User Flows

### User Logs In

1. `UserAuthPage.jsx` calls `useAuth().login`.
2. `useAuth.js` runs the login mutation.
3. `authApi.js` posts credentials to `/api/auth/login`.
4. `authController.js` validates credentials and sets the JWT cookie.
5. The backend returns `{ user }`.
6. `useAuth.js` stores `{ user }` in the `['authUser']` query cache.
7. `App.jsx` sees the user is authenticated and routes them to `/dashboard`.

### User Uploads A Session

1. `AddSessionPage.jsx` builds `FormData`.
2. `useSessions.js` calls `addSession`.
3. `sessionApi.js` posts to `/api/sessions`.
4. `sessionRoutes.js` runs auth and upload middleware.
5. `sessionController.js` detects poker site, parses the file, calculates stats, creates the session, and updates bankroll.
6. The backend returns `{ session, user }`.
7. `useSessions.js` updates the sessions cache and auth user cache.
8. Dashboard/session pages refresh from the updated caches.

### User Views Dashboard

1. `DashboardPage.jsx` fetches sessions through `useSessions`.
2. `StatCardsData.jsx` calculates summary card values.
3. `ProfitChart.jsx` transforms sessions into chart points.
4. CSS files render the dark RiverIQ dashboard UI.

### User Views Hand Charts

1. `HandChartsPage.jsx` fetches sessions.
2. It aggregates `stats.handsByPosition`.
3. It checks uploaded hand count against `ACTUAL_HAND_CHART_UNLOCK_HANDS`.
4. It renders recommended ranges and actual frequency ranges.

### User Edits Settings

1. `SettingsPage.jsx` loads `user` from `useAuth`.
2. The user changes preferences/avatar/bankroll/subscription-related controls.
3. `useAuth.js` mutations call `authApi.js`.
4. `authController.js` updates MongoDB.
5. `useAuth.js` replaces the cached `['authUser']` data.

## CSS Files

CSS files in this project are mostly paired by name with a component or page. They define layout, responsive behavior, colors, borders, typography, spacing, modals, tables, charts, and disabled/locked states. If a JSX file controls behavior, its matching CSS file controls the visual presentation.

## What To Read First

For backend behavior:

1. `backend/src/app.js`
2. `backend/src/routes/*.js`
3. `backend/src/controllers/*.js`
4. `backend/src/models/*.js`
5. `backend/src/utils/parsers/stats/calculateStats.js`

For frontend behavior:

1. `frontend/src/main.jsx`
2. `frontend/src/App.jsx`
3. `frontend/src/hooks/useAuth.js`
4. `frontend/src/hooks/useSessions.js`
5. The page/component for the feature you are changing.

