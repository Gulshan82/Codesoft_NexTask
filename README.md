# NexTask ⚡

**NexTask** is a premium, enterprise-grade, full-stack Project Management Platform inspired by Trello, Jira, and Asana. It features a modern **glassmorphic UI**, real-time task workflows, and team collaboration spaces designed to maximize developer velocity and project transparency.

---

## 🌟 Key Modules

### 📊 1. Glassmorphic SaaS Dashboard
- **Live Metrics**: Track *Total Tasks, Completed Tasks, Pending Work, Overdue Items,* and *Active Team Members* at a single glance.
- **Visual Analytics**: Interactive velocity progress area charts and status distribution pie charts powered by **Recharts**.
- **Role-Based Views**: Permissions automatically adapt the layout whether you are an **Admin**, **Project Manager**, or **Team Member**.

### 📋 2. Interactive Kanban Board
- **HTML5 Drag-and-Drop**: Smooth, animated task transitions between stages (`To Do`, `In Progress`, `Review`, `Completed`) with custom drop indicators.
- **Instant Synchronization**: Automatic backend updates on task drop so the team is always in sync.

### 💬 3. Discussions Hub (Chat Workspace)
- **Project Channels**: Contextual chat workspaces for every single project workspace.
- **Team Communications**: Post updates, discuss bottlenecks, and collaborate directly with team members in real-time.

### 📅 4. Milestones Calendar
- **Deadline Matrix**: Compile project deadlines into a single visual calendar grid.
- **Overdue Indicators**: Instant visual cues highlight overdue tasks to prevent delivery delays.

### 👥 5. Team Directory & Role Management
- **Directory Grid**: Visual list of all team members with active plan tiers.
- **Admin Control Panel**: Inline dropdown actions allowing Admins to change member roles (**Admin**, **Project Manager**, **Team Member**) instantly.

---

## 🛠️ Architecture & Tech Stack

| Tier | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Redux Toolkit, React Query v5, Axios |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Backend API** | Node.js, Express.js (REST architecture) |
| **Security** | JWT Authentication, Bcrypt Hashing, Helmet Security Headers, CORS, Rate Limiting |
| **Uploads** | Multer, Cloudinary Integration |

---

## 📂 Folder Structure

```text
NexTask/
├── backend/
│   ├── config/             # Database connection setups
│   ├── controllers/        # Express business logic controllers
│   ├── middlewares/        # JWT Authentication, RBAC checks, Rate limiters, Error handling
│   ├── models/             # Mongoose Schemas (User, Project, Task, Comment, Activity)
│   ├── routes/             # API Endpoint router directories
│   ├── utils/              # JWT signs, token generator helpers
│   ├── app.js              # Express core configurations
│   ├── server.js           # Server startup script
│   └── verify.js           # Database integration verification script
├── frontend/
│   ├── src/
│   │   ├── app/            # Redux store setup
│   │   ├── components/     # UI Elements (GlassCard, Modals, Layout elements)
│   │   ├── features/       # Redux Slices (Auth, Theme state)
│   │   ├── hooks/          # React Query v5 network data hooks
│   │   ├── pages/          # Auth routes, Dashboard, Kanban, Discussions, Profile
│   │   ├── services/       # Axios client & proxy interceptor configs
│   │   ├── App.jsx         # Component router mapping
│   │   ├── index.css       # Tailwind CSS v4 directives & custom animations
│   │   └── main.jsx        # App mounting entry point
│   ├── vercel.json         # Vercel single-page router rewrite setup
│   └── vite.config.js      # Proxy mapping for localhost endpoint connectivity
```

---

## ⚙️ Local Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas)

### Step 1: Clone and Configure Backend

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_secret_jwt_token_2026_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

### Step 2: Run Backend Server

Start the API server in development mode:
```bash
npm run dev
```
The API server will start listening on `http://127.0.0.1:5000`.

### Step 3: Run Frontend App

1. Open a new terminal tab and go to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Boot up the Vite dev server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`. Vite will automatically proxy your requests from `/api` to the backend.

---

## 💡 Troubleshooting

### 1. Vite Proxy Error (`ECONNREFUSED` on port 5000)
If your frontend terminal prints proxy connection errors when attempting to register or log in, check that:
- The backend server is actively running.
- In macOS and newer Node.js versions (v18+), `localhost` defaults to the IPv6 address (`::1`). The proxy target in `vite.config.js` is set to `http://127.0.0.1:5000` (IPv4) to ensure robust local connections.

### 2. "Invalid email or password" for default accounts
If you are unable to login with pre-loaded database accounts:
- Make sure passwords in the database are either correctly hashed with Bcrypt or matched via the plain-text fallback implemented in `User` model.
- You can run the database repair scripts (`node verify.js` or `node restore_passwords.js` inside the `backend/` folder) to set default passwords for all test accounts.

---

## 📘 Detailed Setup Guides

To configure databases and prepare production hosting, check out:
- 🗄️ **Database setup**: [MongoDB Atlas Setup Guide](./MONGODB_SETUP.md)
- ☁️ **Backend Hosting**: [Render Deployment Guide](./DEPLOYMENT_RENDER.md)
- 🚀 **Frontend Hosting**: [Vercel Deployment Guide](./DEPLOYMENT_VERCEL.md)
