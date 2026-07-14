# Mohit Patil – Full Stack SWE Contributions

**Role:** Full Stack Software Engineer  
**Focus:** Frontend Architecture, Backend API Design, Cloud Deployment, Security, & System Integration  

## Key Responsibilities & Achievements

### 1. Backend Engineering & Architecture (Node.js + Express)
- **Production-Grade MVC Architecture:** Designed a scalable layered architecture separating Routes, Controllers, Services, and Models.
- **Robust Error Handling:** Engineered a centralized error-handling pipeline using a custom `ApiError` class and an `asyncHandler` wrapper, eliminating `try/catch` boilerplate.
- **Strict Input Validation:** Implemented request validation middleware using **Joi** schemas at the route boundary to guarantee data integrity.
- **Structured Observability:** Integrated **Winston** and **Morgan** for tiered, structured logging (console for dev, file transport for production).
- **Advanced Query Optimization:** Designed MongoDB compound indexes (e.g., `{ user: 1, createdAt: -1 }`) to ensure O(1) read performance for high-traffic analytical endpoints.
- **Resilient Integration:** Built an **Axios**-based Python inference client featuring configurable timeouts, dynamic retry logic, and multipart streaming.

### 2. Authentication & Cybersecurity
- **Enterprise-Grade Auth:** Built an end-to-end authentication system featuring short-lived access tokens and secure refresh token rotation.
- **Role-Based Access Control (RBAC):** Implemented middleware to strictly enforce admin vs. user privileges across all API endpoints.
- **Tiered Rate Limiting:** Developed sophisticated request throttling strategies (aggressive limits for auth routes, moderate limits for inference uploads, standard limits for general API) using `express-rate-limit`.
- **Comprehensive Threat Mitigation:** Hardened the API against XSS (`xss-clean`), NoSQL Injection (`express-mongo-sanitize`), HTTP Parameter Pollution (`hpp`), and enforced strict CSP headers via `Helmet`.

### 3. Frontend Architecture (React + Vite + TypeScript)
- **Environment-Aware API Client:** Replaced brittle proxy rewrites with a robust, centralized API client that dynamically routes requests based on the deployment environment (development vs. production).
- **Advanced Responsive UI Engineering:** Overhauled the application's global layout constraint system (1600px grids) and built dynamic React components that fluidly adapt to ultra-wide displays without sacrificing aesthetics.
- **Premium UX & Micro-Animations:** Engineered sophisticated, state-driven interactions utilizing `framer-motion` (e.g., 3D lifts, dynamic drop shadows, hover states) to elevate the platform from a standard web app to a premium clinical tool.
- **State Management Resilience:** Hardened React components against unpredictable nested API payloads, implementing defensive rendering strategies to ensure flawless execution and prevent full-tree crashes.
- **Clinical Dashboard:** Developed dynamic data visualization using Recharts for aggregating diagnostic statistics.

### 4. Cloud Infrastructure & DevOps
- **Hardened Containerization:** Authored production-ready, multi-stage `Dockerfile` deployments utilizing non-root users (`node:node`), `.dockerignore` context pruning, and embedded healthcheck probes.
- **CI/CD Pipeline Automation:** Engineered GitHub Actions workflows (`ci.yml`) to automatically validate Node.js and React builds, install dependencies, and run health probe tests on every push and pull request.
- **Graceful Degradation & Shutdown:** Implemented process-level `SIGTERM` handlers to drain active queues and safely close MongoDB connections before terminating the Node instance on cloud platforms.
- **Resource Constraints Management:** Engineered a singleton `QueueService` with an event emitter to successfully serialize memory-heavy Python inference requests on constrained PaaS environments (Render free tier).

## Technology Stack Used
- **Frontend:** React, TypeScript, Vite, React Router, Framer Motion, Recharts, Lucide React
- **Backend:** Node.js, Express.js (MVC), MongoDB Atlas, Mongoose, JWT, Joi, Winston, Axios
- **DevOps/Security:** Docker, GitHub Actions CI/CD, Helmet, Morgan, Bcrypt, Render, Vercel
