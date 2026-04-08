# Property Management Frontend

A production-ready Vue 3 dashboard for managing rental properties, income records, and expense records through a live backend API.

This frontend is designed for a landlord or property owner who wants to:
- view a portfolio of rental properties
- add, edit, and delete property records
- review income and expenses tied to each property
- confirm that the UI is connected to a real backend and real database-backed data

The app uses a clean card-based dashboard layout, sidebar navigation, live summary widgets, filters, and lightweight charts derived from API responses. It also includes URL-persisted filters, saved views, CSV export, browser-saved property notes, toast feedback, rent-status intelligence, payment-gap alerts, profitability ranking, timeline views, advanced property comparison, printable reporting views, and persistent accessibility controls including light/dark mode.

## Table of Contents

- [Overview](#overview)
- [Who This App Is For](#who-this-app-is-for)
- [Tech Stack](#tech-stack)
- [How the App Works](#how-the-app-works)
- [Frontend and Backend Integration](#frontend-and-backend-integration)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [How to Use the App](#how-to-use-the-app)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
  
## Overview

This repository contains the frontend for a Property Management application built with Vue 3 and Vite.

The frontend connects to an existing backend API and uses live data to power:
- the dashboard summary cards
- the property list
- property detail pages with tabbed overview, income, and expense sections
- income and expense activity views
- API connection status panels
- charts and filters

This repository does not contain the backend API itself. Instead, it consumes a separately deployed backend service.

## Who This App Is For

This app is intended for:
- landlords managing one or more rental properties
- students building a full-stack property management project
- recruiters or reviewers who want to see clear frontend/backend integration
- anyone evaluating a Vue-based admin dashboard that works with a REST API

## Tech Stack

The project uses the actual stack found in this repository:

- Vue 3
- Vue Router
- Vite
- Native `fetch` for API requests
- Plain CSS for styling
- Lightweight SVG-based chart components
- Docker for containerized deployment
- `serve` for serving the built app in production

## How the App Works

At a high level:

1. The app starts from `src/main.js`
2. Vue Router controls navigation between dashboard pages
3. API requests are centralized in `src/api/client.js` and `src/api/propertyService.js`
4. A dashboard aggregation layer in `src/api/dashboardService.js` combines property, income, expense, and totals responses into one frontend-friendly snapshot
5. Views render live data and derived metrics such as:
   - total properties
   - occupied vs vacant properties
   - income record counts
   - expense record counts
   - estimated monthly rent total
   - income and expense trends
   - previous-period KPI changes
   - upcoming rent gap calculations
   - property comparison metrics
   - saved filter views and accessibility preferences stored locally

## Frontend and Backend Integration

This frontend is explicitly designed to show that it is connected to a real backend.

It reads the API base URL from `VITE_API_BASE_URL`, and the current default value is:

```env
VITE_API_BASE_URL=https://prop-mgmt-api-129124698283.us-central1.run.app
```

The frontend calls these backend endpoints through the service layer:

- `GET /`
- `GET /properties`
- `GET /properties/:id`
- `POST /properties`
- `PUT /properties/:id`
- `DELETE /properties/:id`
- `GET /properties/:id/summary`
- `GET /totals/:id`
- `GET /income/:propertyId`
- `POST /income/:propertyId`
- `GET /expenses/:propertyId`
- `POST /expenses/:propertyId`

The app makes the connection visible in the UI by showing:
- an API connection panel
- the configured API base URL
- backend metadata such as version, storage, and deployment
- last refreshed timestamps
- counts and widgets derived from live responses
- empty states when the backend returns no records
- error states when requests fail
- success toasts after key actions such as exports and record creation

## Features

### Dashboard

- sidebar navigation
- top header with primary actions
- persistent light/dark mode toggle for usability and accessibility
- welcoming operations-focused dashboard
- live summary widgets
- quick workflow cards for properties, adding properties, income, and expenses
- priority follow-up section for payment gaps and vacant properties
- API status panel
- date-range filtering with quick range buttons
- this-period cash-flow summary
- KPI deltas compared to the previous period
- upcoming rent collection snapshot
- monthly rent-status tracking (paid, partial, late, vacant)
- payment-gap and vacancy follow-up guidance
- profitability ranking by net cash flow
- monthly income vs expense line chart
- portfolio activity timeline

### Home

- dedicated landing page for first-time users and demos
- guided navigation cards to dashboard, properties, income, expenses, reports, and add-property flow
- designed to make user testing easier by reducing initial confusion

### Properties

- view all properties from the live API
- occupancy and vacancy indicators
- monthly rent-status indicator on each property card
- current-month collected amount and rent-gap amount on cards
- rent, income count, expense count, and net cash flow on property cards
- filters for search, occupancy, city, property type, rent status, and sorting
- filter state saved in the URL
- saved property filter views stored in browser local storage
- keyboard shortcut support for focusing property search
- compare up to 3 properties side by side
- CSV export for the filtered property list
- create property form
- edit property form
- delete property action with confirmation

### Property Detail

- view one property and its summary data
- redesigned hero section with badges and primary actions
- tabbed overview, income, and expenses workspace
- property-level charts for income by year and expenses by category
- property activity timeline combining income and expense events in chronological order
- local browser-saved property notes
- property summary CSV export
- combined property transaction ledger CSV export
- CSV export for property income and expense tables
- view income records for that property
- add new income records
- view expense records for that property
- add new expense records

### Income Overview

- portfolio-wide income activity view
- filters by property, year, date range, and text search
- URL-persisted filters
- saved analytical views stored in browser local storage
- CSV export for the filtered table
- monthly income trend chart
- income by property chart
- month-based income calendar view

### Expense Overview

- portfolio-wide expense activity view
- filters by property, category, year, date range, and text search
- URL-persisted filters
- saved analytical views stored in browser local storage
- CSV export for the filtered table
- monthly expense trend chart
- expenses by category chart
- clicking chart categories can drive filtering
- month-based expense calendar view

### Reports

- dedicated reports page built from the live portfolio snapshot
- monthly, year-to-date, and all-time report presets
- last 90 days and last 12 months presets
- executive summary cards for occupancy, paid/late properties, and portfolio cash flow
- top-performer and rent-gap ranking sections
- monthly portfolio activity calendar
- printable property-by-property summary table
- summary, transaction, and rent-gap CSV exports
- print-friendly styling

### API Status

- dedicated page showing live backend connectivity details
- shows the expected backend docs URL when available

### Themes

- light and dark themes are supported
- theme preference is saved in browser local storage
- the app respects system dark-mode preference on first load

### Accessibility

- larger text mode
- readable font mode
- underline-links mode
- comfortable spacing mode
- reduced-motion mode
- high-contrast mode
- skip-to-content link for keyboard users
- toast announcements exposed through an `aria-live` region

## Project Structure

This is the current folder structure relevant to the app:

```text
src/
  composables/
    useAccessibility.js
    useQueryFilters.js
    useTheme.js
  api/
    client.js
    dashboardService.js
    propertyService.js
  components/
    AlertMessage.vue
    ConnectionPanel.vue
    EmptyState.vue
    LoadingSkeleton.vue
    LoadingState.vue
    PropertyForm.vue
    PropertyOverviewCard.vue
    RecordForm.vue
    SidebarNav.vue
    SimpleBarChart.vue
    SimpleDoughnutChart.vue
    SimpleLineChart.vue
    StatCard.vue
    ToastStack.vue
  router/
    index.js
  utils/
    exporters.js
    formatters.js
    propertyNotes.js
    toasts.js
  views/
    ApiStatusView.vue
    DashboardView.vue
    ExpensesOverviewView.vue
    IncomeOverviewView.vue
    PropertiesListView.vue
    PropertyCreateView.vue
    PropertyDetailView.vue
    PropertyEditView.vue
    ReportsView.vue
  App.vue
  main.js
  styles.css
```

## Getting Started

### 1. Prerequisites

Make sure you have the following installed:

- Node.js 20+ recommended
- npm

Check your versions:

```bash
node -v
npm -v
```

### 2. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/prop_mgmt_frontend.git
cd prop_mgmt_frontend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create a local environment file

```bash
cp .env.example .env
```

### 5. Start the development server

```bash
npm run dev
```

Vite will print a local URL, usually something like:

```text
http://localhost:5173
```

Open that URL in your browser.

## Environment Variables

The app uses a single Vite environment variable:

- `VITE_API_BASE_URL`

### Example `.env`

```env
VITE_API_BASE_URL=https://prop-mgmt-api-129124698283.us-central1.run.app
```

### Notes

- `.env.example` contains the intended backend URL for development
- `.env.production` also contains the same backend URL so production builds have a safe default
- you can override it at build time if needed

## Available Scripts

The real scripts from `package.json` are:

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Creates a production build in `dist/`.

```bash
npm run preview
```

Serves the built app locally for preview.

```bash
npm start
```

Serves the built app from `dist/` using the `serve` package.

## How to Use the App

This section is written for a first-time user.

### 1. Start on Home

When the app loads, the default route is the home landing page.

Here you should see:
- a simple landing experience
- clear navigation cards for the main workflows
- quick buttons for starting with the dashboard or properties

This screen is meant to help first-time users quickly choose where to begin.

### 2. Open the Dashboard

From the landing page or the sidebar, open **Dashboard**.

Here you should see:
- a friendlier daily workspace
- quick links into the most common tasks
- high-level portfolio summary cards
- follow-up guidance for payment gaps and vacancies
- recent activity
- date-range controls
- API connection details
- portfolio trends lower on the page when you need more context

If the backend is reachable, the dashboard should populate automatically.

### 3. Review the API connection panel

Use the connection panel to verify:
- which backend URL the app is using
- whether the API responded successfully
- when data was last refreshed

### 4. Open the Properties page

Use the left sidebar to go to **Properties**.

This page shows:
- all properties returned by the backend
- property type
- address
- tenant status
- monthly rent
- income and expense record counts
- net cash flow
- URL-backed filters for search, occupancy, city, property type, rent status, and sorting
- saved property views and side-by-side comparison
- CSV export for the currently filtered list

### 5. Add a property

Go to **Add Property** and complete the form.

The form sends a `POST` request to the backend and redirects you to the new property detail page after a successful save.

### 6. View a property detail page

From the properties list, click **View Details**.

The detail page shows:
- property information
- summary totals
- local browser notes for that property
- income records
- expense records
- forms for adding new income and expense records
- a property summary export and full ledger export
- CSV export buttons for property-level transactions

### 7. Edit or delete a property

From the property card or detail page:
- click **Edit** to update the property
- click **Delete Property** to remove it if the backend supports deletion

The UI includes confirmation before delete.

### 8. Review income activity

Open **Income** in the sidebar.

You can:
- review live income records across the portfolio
- filter by property
- filter by year
- filter by start and end date
- search descriptions
- save reusable income filter views
- export the filtered rows to CSV
- view live charts based on the filtered data
- browse income activity in a monthly calendar

### 9. Review expense activity

Open **Expenses** in the sidebar.

You can:
- review live expense records across the portfolio
- filter by property
- filter by category
- filter by year
- filter by start and end date
- search vendors or descriptions
- save reusable expense filter views
- export the filtered rows to CSV
- view charts based on the filtered data
- browse expense activity in a monthly calendar

### 10. Open Reports

Open **Reports** in the sidebar.

You can:
- review a printable executive summary
- switch between month, last 90 days, year-to-date, last 12 months, and all-time report presets
- see top-performing properties and current rent-gap leaders
- review a portfolio activity calendar for the selected month
- print the report or export summary, transaction, and rent-gap CSVs

### 11. Use the API Status page

Open **API Status** to validate frontend/backend integration.

This page is especially useful during demos because it proves:
- the frontend knows the backend URL
- the backend is reachable
- property data is being fetched successfully

## Deployment Notes

This repository includes a `Dockerfile` for Cloud Run deployment.

### Local production build

```bash
npm run build
npm run preview
```

### Docker build

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://prop-mgmt-api-129124698283.us-central1.run.app \
  -t gcr.io/YOUR_PROJECT_ID/property-management-frontend .
```

### Push to container registry

```bash
docker push gcr.io/YOUR_PROJECT_ID/property-management-frontend
```

### Deploy to Google Cloud Run

```bash
gcloud run deploy property-management-frontend \
  --image gcr.io/YOUR_PROJECT_ID/property-management-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Production behavior

- the container builds the Vite app
- the final image serves the built `dist/` folder on port `8080`
- if no build arg is passed, `.env.production` provides the default backend URL

## Troubleshooting

### The app loads, but no data appears

Check:

- Is the backend URL correct in `.env` or `.env.production`?
- Does the backend respond at:

```bash
curl https://prop-mgmt-api-129124698283.us-central1.run.app/
curl https://prop-mgmt-api-129124698283.us-central1.run.app/properties
```

- Does the API Status page show a connection error?

### I updated `.env`, but the frontend still uses the old backend

Vite reads environment variables at startup/build time.

Restart the development server:

```bash
npm run dev
```

For production, rebuild the app:

```bash
npm run build
```

### `npm` is not found

Install Node.js, which includes `npm`.

On macOS with Homebrew:

```bash
brew install node
```

Then verify:

```bash
node -v
npm -v
```

### The UI builds locally but not in Cloud Run

Check:
- that the Docker build receives the correct `VITE_API_BASE_URL`
- that the backend URL is reachable from the deployed environment
- that the latest commit was actually redeployed

### Requests fail with an error message in the UI

This app surfaces backend errors directly through the alert components.

Common causes:
- incorrect API URL
- backend service unavailable
- validation errors on create/update forms
- unsupported or missing backend data

### The dashboard seems slow

The dashboard aggregates per-property data by calling:
- properties
- income by property
- expenses by property
- totals by property

That gives a richer live snapshot, but it can take longer than a single endpoint call when many properties exist.

### My filters disappeared

Filters on the Dashboard, Properties, Income, and Expenses pages are stored in the URL query string.

If a filter disappears, check whether:
- you navigated to a different route
- you manually cleared the URL query parameters
- you used a quick range button that replaced the current dates

### Where are property notes stored

Property notes are currently stored in browser `localStorage`, not in the backend API.

That means:
- notes stay on the same browser
- notes are not shared across devices
- clearing browser storage will remove them
<<<<<<< HEAD

## Portfolio Notes

This project demonstrates:
- component-based frontend architecture in Vue 3
- environment-based API configuration
- real frontend/backend integration
- derived dashboard analytics from live responses
- CRUD workflows with clean feedback states
- responsive admin dashboard styling

If you are reviewing this repository on GitHub, the best place to start is:

1. `src/api/` for how data is fetched
2. `src/views/` for the user-facing pages
3. `src/components/` for reusable UI building blocks
=======
>>>>>>> 94089273db55dc35a615939b0bae22f799375e93
