# Codebase Explained: A MERN Stack Guide for Beginners

Welcome! This document explains the entire codebase of this project. It is written for someone who knows the basics of coding but might be new to the **MERN** stack (MongoDB, Express, React, Node.js) or full-stack development.

## 1. The Big Picture: What is MERN?

This project is a web application built using the MERN stack. Here's what that means:

*   **M (MongoDB)**: The **Database**. It stores data like users, assignments, and submissions in JSON-like documents.
*   **E (Express)**: The **Backend Framework**. It runs on Node.js and handles API requests (like "login user" or "get assignments").
*   **R (React)**: The **Frontend Library**. It builds the user interface (UI) that you see in the browser.
*   **N (Node.js)**: The **Runtime**. It allows us to run JavaScript outside the browser (on the server).

**How they talk:**
The **Frontend (React)** sends HTTP requests (fetch) to the **Backend (Express)**. The Backend talks to the **Database (MongoDB)**, gets data, and sends it back to the Frontend.

---

## 2. Project Structure

The project is split into two main folders:

*   `backend/`: The server-side code (Node.js + Express + MongoDB).
*   `frontend/`: The client-side code (React + Vite + Tailwind CSS).

This is a **monorepo** (single repository) structure. You run the backend and frontend separately (usually in two different terminals).

---

## 3. Backend Deep Dive (`backend/`)

The backend behaves like a waiter in a restaurant. It takes orders (requests) from the customer (frontend), gives them to the kitchen (database), and brings back the food (data).

### Key Files & Folders

#### `package.json`
This is the ID card of the project. It lists dependencies:
*   `express`: The web server framework.
*   `mongoose`: A tool to interact with MongoDB easiest.
*   `jsonwebtoken`: For creating secure "tokens" (like a digital ID card) for logged-in users.
*   `bcrypt`: For scrambling (hashing) passwords so we never store them as plain text.

#### `src/index.js` (The Entry Point)
This is where the server starts.
*   It connects to MongoDB using `config/db.js`.
*   It sets up "middleware" (code that runs on every request), like `cors` (allowing frontend to talk to backend) and `cookieParser`.
*   It defines the main routes (URLs the server listens to), like `/api/auth` or `/api/student`.

#### `src/models/` (The Blueprints)
These files define what our data looks like. Mongoose uses "Schemas" for this.
*   **`UserProfile.js`**: Defines what a "User" is (name, email, role, etc.).
*   **`LocalCredential.js`**: Stores username/password for local login.
*   **`PblSubmission.js`**: Stores student project submissions.

#### `src/controllers/` (The Logic)
This is the "brain" of the backend. When a request comes in, a controller function handles it.
*   **`authController.js`**: Handles Login, Logout, and Keycloak (SSO) logic.
*   **`studentController.js`**: Handles student actions (uploading projects, viewing dashboard).
*   **`adminController.js`**: Handles admin actions (managing users).
*   **Refactoring Note**: Subroutines like `ensureDb` and `parsePagination` are shared in `lib/helpers.js` to avoid repetitive code.

#### `src/middleware/` (The Bouncers)
Middleware functions run *before* the controller. They check if you are allowed to pass.
*   **`authMiddleware.js`**: Checks if you have a valid JWT token. "Are you logged in?"
*   **`rbac.js`**: Role-Based Access Control. "Are you an Admin? A Student?" If not, it blocks access.

---

## 4. Frontend Deep Dive (`frontend/`)

The frontend is what the user interacts with. It's built with **React** and bundled using **Vite** (a super-fast build tool).

### Key Files & Folders

#### `src/main.jsx` & `index.html`
*   `index.html`: The only HTML file. React "injects" the entire app into a `<div id="root"></div>` here.
*   `main.jsx`: The JavaScript entry point. It finds that `div` and renders the `<App />` component.

#### `src/App.jsx` (The Router)
This file controls navigation.
*   It uses `react-router-dom` to map URLs (like `/home` or `/login`) to components (pages).
*   **Protected Routes**: It wraps pages in a `<Layout>` component and checks `isAuthenticated`. If you aren't logged in, it redirects you to `/login`.
*   **Static Imports**: We import pages directly (e.g., `import Login from ...`) to ensure navigation is instant, avoiding "white flashes".

#### `src/components/` (Reusable UI)
Small building blocks used across multiple pages.
*   `Sidebar.jsx`: The navigation menu. It changes based on your role (Student vs Admin).
*   `Layout.jsx`: The wrapper that adds the Sidebar and TopBar to every page.

#### `src/pages/` (The Views)
Large components that represent full screens.
*   `Login.jsx`: The login screen. Handles form submission for both local login and Keycloak.
*   `PblPresentation.jsx`: The form students fill out. It has a **loading state** to prevent flickering while fetching data.

#### `src/lib/utils.js`
Contains helper functions, like `cn()` which helps combine Tailwind CSS classes dynamically (e.g., "make this button red if there is an error").

---

## 5. Key Concept: Authentication (Logging In)

This app supports **two** ways to log in:

1.  **Local Login**:
    *   User enters username/password.
    *   Backend checks `LocalCredential` collection.
    *   If correct, it creates a **JWT** (JSON Web Token) and sends it as an HTTP-only cookie.
    *   Browser sends this cookie automatically with future requests.

2.  **Keycloak (SSO)**:
    *   User clicks "Sign In with Keycloak".
    *   App redirects user to the university's Keycloak server.
    *   User logs in there.
    *   Keycloak redirects back to our backend (`/api/auth/keycloak/callback`) with a code.
    *   Backend trades this code for a user token, finds the user in our DB, and issues our own JWT cookie.

---

## 6. How to Read the Code

If you want to understand how a specific feature works (e.g., "Student submitting a project"):

1.  **Start at the UI**: Go to `frontend/src/pages/PblPresentation.jsx`.
2.  **Find the Fetch**: Look for `fetch('/api/student/pbl-presentations', ...)` in the `onSubmit` function.
3.  **Trace to Backend**: Go to `backend/src/index.js` or `routes/` (if separated) and look for that URL path.
4.  **Find the Controller**: See which function handles that route (e.g., `studentController.createSubmission`).
5.  **Check the Model**: See what data it saves (`PblSubmission.js`).

## 7. Tips for Beginners

*   **console.log is your friend**: If you're stuck, print variables to the console to see what they hold.
*   **Check the Network Tab**: In your browser DevTools (right-click -> Inspect -> Network), you can see every request the frontend sends to the backend. This is crucial for debugging.
*   **Read the Error Messages**: The backend terminal usually tells you exactly what went wrong (e.g., "Connection refused" or "Undefined variable").

Happy Coding!
