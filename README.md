# Zwitscher

Zwitscher is a full-stack microblogging application built with React, TypeScript, and ASP.NET Core. Visitors can browse feeds and public profiles; registered users can publish short posts, manage their content, and like posts. It demonstrates API contract generation, relational data modeling, and browser–API session management.

[Live Demo](https://zwitscher.92.5.64.85.nip.io/)

## Features

- Public feed with newest posts first and author profiles accessible by username.
- Registration, login, automatic access-token renewal, and logout.
- Create and edit posts of 2–300 characters; delete posts with confirmation. Editing and deletion require ownership, enforced by the API.
- Like and unlike posts, view like counts, and browse a personal collection of liked posts.
- Responsive layouts with loading, empty, validation, and error states.

## Technologies

| Area                    | Tools                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| Frontend                | React, TypeScript, Vite, React Router, TanStack Query                         |
| Styling                 | Tailwind CSS, DaisyUI                                                         |
| Backend                 | C#, .NET 10, ASP.NET Core Minimal APIs, Identity, JWT bearer authentication   |
| Persistence             | Entity Framework Core, SQLite, EF Core migrations                             |
| API contract            | OpenAPI, Scalar, Orval-generated TypeScript models and query hooks            |
| Validation and delivery | xUnit, WebApplicationFactory, ESLint, Prettier, GitHub Actions, Docker, Caddy |

## Architecture and engineering concepts

The React application calls the API under `/api`. Endpoint groups handle HTTP concerns, injected services implement application behavior, and `AppDbContext` manages persistence. DTOs separate API contracts from database entities.

- **API contract consistency:** backend builds export OpenAPI; [Orval](frontend/orval.config.ts) generates typed models and TanStack Query hooks. CI checks regenerated code for contract drift.
- **Asynchronous session coordination:** [useAuthSession](frontend/src/auth/useAuthSession.ts) shares an in-flight refresh request, retries an unauthorized request once, and uses session versions to reject stale results after login or logout. Access tokens stay in memory; refresh tokens persist in browser local storage.
- **Token lifecycle and concurrency:** [AuthService](backend/ZwitscherApi/Services/AuthService.cs) rotates refresh tokens, revokes active tokens when a revoked token is reused, and follows replacement chains during logout. EF Core optimistic concurrency and bounded retries handle competing token updates.
- **Relational integrity and authorization:** [AppDbContext](backend/ZwitscherApi/Data/AppDbContext.cs) uses a composite post/user key to prevent duplicate likes and cascades like deletion when a post is removed. [PostService](backend/ZwitscherApi/Services/PostService.cs) checks authorship before updates or deletion and projects read queries directly into DTOs with `AsNoTracking()`.
- **Server-state synchronization:** [LikeButton](frontend/src/components/LikeButton.tsx) invalidates feed, profile, and liked-post queries after mutations, trading extra requests for simpler state management.

## Getting started

Prerequisites: **.NET 10 SDK**, **Node.js 24 with npm**, and **OpenSSL** for the secret-generation command below. Commands assume Bash or zsh and start at the repository root.

Start the API:

```sh
cd backend
dotnet restore ZwitscherApi.slnx
dotnet tool restore --tool-manifest dotnet-tools.json
export Jwt__Key="$(openssl rand -hex 32)"
dotnet ef database update --project ZwitscherApi
dotnet run --project ZwitscherApi --launch-profile http
```

Migrations create the SQLite database; application startup does not apply them automatically. The API runs at `http://localhost:5080`, with development API documentation at `http://localhost:5080/scalar`.

In a second terminal, from the repository root:

```sh
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:5080 npm run dev
```

Open `http://localhost:5173` and register an account. After changing API contracts, build the backend and run `npm run api:generate` in `frontend/` to update the committed client.

## Testing and validation

Run from the repository root:

```sh
dotnet test backend/ZwitscherApi.slnx
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix frontend run format:check
```

The [backend tests](backend/ZwitscherApi.Tests) cover subject-claim parsing, refresh-token activity rules, and feed ordering with author data. The API integration test uses `WebApplicationFactory` with EF Core's InMemory provider; it does not validate SQLite constraints or migrations. There are no automated frontend tests.

[CI](.github/workflows/ci.yml) also checks migration/model consistency, applies migrations to a temporary SQLite database, and verifies generated-client freshness. A separate workflow builds and publishes API, frontend, and migration container images to GHCR.

## Limitations and next steps

1. **Pagination:** feed and profile queries currently return all matching posts; page metadata is a placeholder. Add bounded queries and client pagination.
2. **Session hardening:** refresh tokens are stored in local storage and as raw values in the database. Evaluate HttpOnly cookies, token hashing, and coordination across browser tabs.
3. **Test coverage:** add authentication, ownership, and concurrent-refresh tests against SQLite, plus browser tests for core user flows.
4. **Logout feedback:** the client clears its session even when server logout fails. Surface unsuccessful revocation and define a recovery path.

## Contributions

Team project by [Firewalldefender](https://github.com/Firewalldefender) and [chr-d](https://github.com/chr-d). The [commit history](https://github.com/chr-d/zwitscher/commits/main/) records work across both layers, including:

- **chr-d:** Identity/JWT authentication, refresh-token handling, frontend authentication context and session management, API-client generation, backend tests, and CI.
- **Firewalldefender:** post creation and deletion across API and UI, navigation, post cards, responsive styling, and liked-post views.

The main learning outcome was full-stack implementation and the workflow between backend and frontend. Particular focus was on connecting ASP.NET Core Identity, JWT access and refresh tokens, and React authentication context.
