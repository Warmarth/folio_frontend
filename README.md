# Folio Frontend

Folio is a developer learning platform built with Next.js. This frontend handles the learner experience, mentor workflows, profile creation, exercise browsing, submission review, and mentorship interactions.

The app expects a running backend API to provide authentication, exercise data, profile management, mentor and learner actions, and submission endpoints.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

## Prerequisites

- Node.js 20.9+
- npm
- A running Folio backend API on a local address such as `http://127.0.0.1:5000`

## Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

This value is exposed to the browser and is used for all client-side API calls. Make sure the backend allows requests from:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Local Development

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

Useful scripts:

```bash
npm run lint
npm run build
npm run start
```

## App Features

- Landing page and public marketing content
- User registration and login
- Learner dashboard with profiles and mentorship discovery
- Exercise catalog and exercise detail pages
- Exercise submission flow
- Mentor dashboard for creating exercises and reviewing submissions
- Learner and mentor profile management
- Mentorship request and status workflows

## Main Routes

### Public

| Route       | Purpose                                    |
| ----------- | ------------------------------------------ |
| `/`         | Landing page                               |
| `/register` | Create a new account                       |
| `/login`    | Sign in and store the JWT/access token     |
| `/me`       | View and manage the signed-in user profile |

### Learner / Dashboard

| Route                        | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `/dashboard`                 | Learner home and profile overview     |
| `/dashboard/user/[id]`       | User profile detail                   |
| `/dashboard/exercises`       | List available exercises              |
| `/dashboard/exercises/[id]`  | Open an exercise and submit work      |
| `/dashboard/projects`        | Project-related views                 |
| `/dashboard/code-review`     | Review workflow and submissions       |
| `/dashboard/mentorship`      | Browse mentors and request mentorship |
| `/dashboard/mentorship/[id]` | Mentor profile and mentorship details |
| `/dashboard/progress`        | Progress tracking                     |
| `/dashboard/settings`        | Account settings                      |

### Mentor

| Route                               | Purpose                         |
| ----------------------------------- | ------------------------------- |
| `/mentor`                           | Mentor entry and profile setup  |
| `/mentor/dashboard`                 | Mentor dashboard overview       |
| `/mentor/dashboard/create_exercise` | Create a new exercise           |
| `/mentor/exercises`                 | Manage mentor-created exercises |
| `/mentor/exercises/[id]`            | Exercise detail and management  |
| `/mentor/submissions`               | Review learner submissions      |
| `/mentor/learners`                  | View assigned learners          |
| `/mentor/performance`               | Mentor performance and activity |
| `/mentor/settings`                  | Mentor settings                 |

## Authentication Notes

Protected routes rely on the browser-stored token named `access_token`. The app reads this token from local storage before calling secured API endpoints.

## Project Structure

```text
app/
  landing and route pages for public, learner, and mentor flows
  components/
    shared UI logic used across pages
public/
  static assets
```

## Backend Dependency

This repository is the frontend client only. It connects to the Folio backend API for business logic and persistence. Make sure the backend is running before testing authenticated flows.

## Notes

- The app is designed for local development with a separate API service.
- If the backend URL changes, update `NEXT_PUBLIC_API_URL` in `.env.local`.
- For production deployment, set this environment variable to the correct public API endpoint.
