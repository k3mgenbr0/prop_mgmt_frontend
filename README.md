# Property Management Frontend

A production-ready Vue 3 dashboard for managing rental properties, income records, and expense records through a live backend API.

This frontend is designed for a landlord or property owner who wants to:
- view a portfolio of rental properties
- add, edit, and delete property records
- review income and expenses tied to each property
- confirm that the UI is connected to a real backend and real database-backed data

The app uses a clean card-based dashboard layout, sidebar navigation, live summary widgets, filters, and lightweight charts derived from API responses.

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
- [Suggested Screenshots for GitHub](#suggested-screenshots)

## Overview

This repository contains the frontend for a Property Management application built with Vue 3 and Vite.

The frontend connects to an existing backend API and uses live data to power:
- the dashboard summary cards
- the property list
- property detail pages
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

## Features

### Dashboard

- sidebar navigation
- top header with primary actions
- live summary widgets
- API status panel
- monthly income vs expense line chart
- monthly rent by property bar chart
- property preview cards

### Properties

- view all properties from the live API
- occupancy and vacancy indicators
- rent, income count, expense count, and net cash flow on property cards
- create property form
- edit property form
- delete property action with confirmation

### Property Detail

- view one property and its summary data
- view income records for that property
- add new income records
- view expense records for that property
- add new expense records

### Income Overview

- portfolio-wide income activity view
- filters by property, year, and text search
- monthly income trend chart
- income by property chart

### Expense Overview

- portfolio-wide expense activity view
- filters by property, category, year, and text search
- monthly expense trend chart
- expenses by category chart

### API Status

- dedicated page showing live backend connectivity details

## Project Structure

This is the current folder structure relevant to the app:

```text
src/
  api/
    client.js
    dashboardService.js
    propertyService.js
  components/
    AlertMessage.vue
    ConnectionPanel.vue
    EmptyState.vue
    LoadingState.vue
    PropertyForm.vue
    PropertyOverviewCard.vue
    RecordForm.vue
    SidebarNav.vue
    SimpleBarChart.vue
    SimpleLineChart.vue
    StatCard.vue
  router/
    index.js
  utils/
    formatters.js
  views/
    ApiStatusView.vue
    DashboardView.vue
    ExpensesOverviewView.vue
    IncomeOverviewView.vue
    PropertiesListView.vue
    PropertyCreateView.vue
    PropertyDetailView.vue
    PropertyEditView.vue
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

### 1. Open the Dashboard

When the app loads, the default route is the dashboard.

Here you should see:
- summary cards
- property count
- occupancy metrics
- income and expense counts
- charts
- API connection details

If the backend is reachable, the dashboard should populate automatically.

### 2. Review the API connection panel

Use the connection panel to verify:
- which backend URL the app is using
- whether the API responded successfully
- when data was last refreshed

### 3. Open the Properties page

Use the left sidebar to go to **Properties**.

This page shows:
- all properties returned by the backend
- property type
- address
- tenant status
- monthly rent
- income and expense record counts
- net cash flow

### 4. Add a property

Go to **Add Property** and complete the form.

The form sends a `POST` request to the backend and redirects you to the new property detail page after a successful save.

### 5. View a property detail page

From the properties list, click **View Details**.

The detail page shows:
- property information
- summary totals
- income records
- expense records
- forms for adding new income and expense records

### 6. Edit or delete a property

From the property card or detail page:
- click **Edit** to update the property
- click **Delete Property** to remove it if the backend supports deletion

The UI includes confirmation before delete.

### 7. Review income activity

Open **Income** in the sidebar.

You can:
- review live income records across the portfolio
- filter by property
- filter by year
- search descriptions
- view live charts based on the filtered data

### 8. Review expense activity

Open **Expenses** in the sidebar.

You can:
- review live expense records across the portfolio
- filter by property
- filter by category
- filter by year
- search vendors or descriptions
- view charts based on the filtered data

### 9. Use the API Status page

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
