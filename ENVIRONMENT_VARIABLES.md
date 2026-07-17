# Frontend Environment Variables - CustomersPortal Next.js

This document provides a detailed breakdown of the environment variables used by the Next.js customer portal frontend.

## Environment Variables Directory

| Variable Name | Section | Required/Optional | Example Value | Exposed to Browser? | Target Deployment Platform |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **NODE_ENV** | Application | Optional | `production` | No | Vercel, Render, Local Development |
| **PORT** | Application | Optional | `3000` | No | Render, Local Development |
| **HOSTNAME** | Application | Optional | `0.0.0.0` | No | Render, Local Development |
| **NEXT_TELEMETRY_DISABLED** | Application | Optional | `1` | No | Vercel, Render, Local Development |
| **NEXT_PUBLIC_API_URL** | Backend API | **Required** | `https://api.dicepvc.com/api/v1` | **Yes** | Vercel, Render, Local Development |
| **NEXT_PUBLIC_RAZORPAY_KEY_ID** | Razorpay | **Required** | `rzp_test_TEchnNOLHizcDZ` | **Yes** | Vercel, Render, Local Development |

---

## Variable Details

### Application Section

#### `NODE_ENV`
- **Purpose**: Defines the execution context of the Node.js/Next.js server. Determines whether to enable development tools (like Hot Module Replacement) or optimize build artifacts for production.
- **Required/Optional**: Optional (Next.js sets this automatically, but overriding is supported).
- **Example Value**: `production`
- **Exposed to Browser**: No (consumed only during build time/server execution).
- **Deployment Platform**: Vercel (automatic), Render (defined in Dockerfile/environment), Local Development.

#### `PORT`
- **Purpose**: The TCP port on which the Next.js production server listens.
- **Required/Optional**: Optional (defaults to `3000`).
- **Example Value**: `3000`
- **Exposed to Browser**: No.
- **Deployment Platform**: Render, Local Development. (Vercel manages port binding internally).

#### `HOSTNAME`
- **Purpose**: The hostname or IP address the Next.js server binds to. Setting to `0.0.0.0` allows binding to all network interfaces, which is required inside containerized environments (like Docker on Render).
- **Required/Optional**: Optional (defaults to `localhost` in local development).
- **Example Value**: `0.0.0.0`
- **Exposed to Browser**: No.
- **Deployment Platform**: Render (defined in runner environment), Local Development.

#### `NEXT_TELEMETRY_DISABLED`
- **Purpose**: Opt-out option to disable anonymous Next.js telemetry data logging.
- **Required/Optional**: Optional (defaults to `0`/enabled).
- **Example Value**: `1` (telemetry collection disabled).
- **Exposed to Browser**: No.
- **Deployment Platform**: Vercel, Render, Local Development.

---

### Backend API Section

#### `NEXT_PUBLIC_API_URL`
- **Purpose**: Tells the Next.js frontend where the FastAPI backend service is located. All frontend client requests (such as auth registration, support ticket submissions, billing actions) route to this endpoint.
- **Required/Optional**: **Required**
- **Example Value**: `https://api.dicepvc.com/api/v1`
- **Exposed to Browser**: **Yes** (uses the `NEXT_PUBLIC_` prefix, making it available in browser bundles).
- **Deployment Platform**: Vercel (configured under Project Settings -> Environment Variables), Render (defined in `render.yaml`), Local Development.

---

### Razorpay Section

#### `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- **Purpose**: The public Key ID associated with the merchant's Razorpay account. Used by the checkout overlay to identify the target integration gateway when generating standard payment modals.
- **Required/Optional**: **Required**
- **Example Value**: `rzp_test_TEchnNOLHizcDZ`
- **Exposed to Browser**: **Yes** (uses the `NEXT_PUBLIC_` prefix, letting the frontend checkout script access it).
- **Deployment Platform**: Vercel, Render, Local Development.
