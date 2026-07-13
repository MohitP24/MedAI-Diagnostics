# Mohit Patil – Full Stack SWE Contributions

**Role:** Full Stack Software Engineer  
**Focus:** Frontend Architecture, Backend API Design, Cloud Deployment, Security, & System Integration  

## Key Responsibilities & Achievements

### 1. Frontend Architecture (React + Vite + TypeScript)
- Built a highly responsive, glassmorphism-styled UI from scratch.
- Implemented robust state management using Context API for Authentication.
- Developed dynamic data visualization using Recharts for the Analytics Dashboard.
- Engineered complex React Router configurations for protected routes.
- Designed the "Upload & Inference" user flow with seamless asynchronous loading states.

### 2. Backend Engineering (Node.js + Express)
- Developed secure RESTful APIs following industry best practices.
- Designed MongoDB schemas (Mongoose) for User Profiles and Prediction History.
- Implemented strict Cybersecurity middleware (Helmet, CORS, Rate Limiting).
- Engineered a background job system to handle massive file uploads and automatic cleanup of processed heatmaps.
- Built a secure bridging API to communicate natively with the Python Inference engine using multi-part form data streams.

### 3. Authentication & Security
- Built an end-to-end JWT (JSON Web Token) authentication system.
- Implemented Bcrypt password hashing.
- Secured backend routes with a `protect` middleware to guarantee data privacy.

### 4. Cloud Infrastructure & DevOps
- Configured MongoDB Atlas for highly available cloud data storage.
- Engineered sequential memory loading pipelines to bypass 512MB RAM limits on free tier PaaS providers (Render).
- Wrote deployment scripts (`render_build.sh`) to reassemble massive `.keras` models dynamically during cloud builds, completely bypassing GitHub's 100MB file limits.
- Configured Vite Proxy and Vercel rewriting rules (`vercel.json`) for seamless frontend-backend communication in production.

## Technology Stack Used
- **Frontend:** React, TypeScript, Vite, React Router, Framer Motion, Recharts, Lucide React
- **Backend:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Bcrypt
- **DevOps:** Render, Vercel, Git, Bash Scripting
