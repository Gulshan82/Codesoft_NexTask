# Frontend Deployment Guide (Vercel)

This guide walks you through deploying the React + Vite frontend for **NexTask** to [Vercel](https://vercel.com/).

## Prerequisites
* A [Vercel](https://vercel.com/) account.
* A GitHub repository containing the NexTask project.
* A live Render backend URL (see [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)).

---

## Step 1: Create a Project on Vercel

1. Log in to your Vercel Dashboard.
2. Click **Add New** and select **Project**.
3. Import your GitHub repository containing the NexTask codebase.
4. Configure the Project settings:
   * **Project Name**: `nextask` (or custom name).
   * **Framework Preset**: `Vite`.
   * **Root Directory**: Click "Edit" and choose the `frontend` folder (essential: since the frontend lives in the `frontend/` folder).
   * **Build and Development Settings**: Keep defaults (`Build Command: npm run build`, `Output Directory: dist`).

---

## Step 2: Configure Environment Variables

Under the **Environment Variables** section, add the following key:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://nextask-api.onrender.com/api` | The live Render backend server `/api` path. |

---

## Step 3: Deploy

1. Click **Deploy**.
2. Vercel will install dependencies, build the React distribution bundle, and publish it.
3. Once completed, Vercel will generate a live production domain (e.g., `https://nextask.vercel.app`).

---

## Step 4: Handle Client-Side Routing (SPA)

We have already configured `vercel.json` inside the `frontend` folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
This configuration is automatically picked up by Vercel and guarantees that routing navigation (like reloading on page `/projects` or `/calendar`) redirects properly without returning Vercel 404 responses.
