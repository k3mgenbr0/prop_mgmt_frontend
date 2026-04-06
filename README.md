# Property Management Frontend

Vue 3 + Vite frontend for the Property Management App. It connects to the live FastAPI backend using `VITE_API_BASE_URL`.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
cp .env.example .env
```

3. Set `VITE_API_BASE_URL` to your deployed backend URL:

```env
VITE_API_BASE_URL=https://prop-mgmt-api-129124698283.us-central1.run.app
```

4. Start the dev server:

```bash
npm run dev
```

5. Open the local Vite URL in your browser.

## Build and preview

```bash
npm run build
npm run preview
```

## Deploy to Google Cloud Run

Build the container and pass the live backend URL at build time:

```bash
docker build --build-arg VITE_API_BASE_URL=https://your-live-api-url.run.app \
  -t gcr.io/YOUR_PROJECT_ID/property-management-frontend .
docker push gcr.io/YOUR_PROJECT_ID/property-management-frontend
gcloud run deploy property-management-frontend \
  --image gcr.io/YOUR_PROJECT_ID/property-management-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

Example with this backend:

```bash
docker build --build-arg VITE_API_BASE_URL=https://prop-mgmt-api-129124698283.us-central1.run.app \
  -t gcr.io/YOUR_PROJECT_ID/property-management-frontend .
```

Cloud Run serves the built frontend on port `8080`.
