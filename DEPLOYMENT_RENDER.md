# Backend Deployment Guide (Render)

This guide walks you through deploying the Node.js/Express.js backend for **NexTask** to [Render](https://render.com/).

## Prerequisites
* A [Render](https://render.com/) account.
* A GitHub repository containing the NexTask project.
* A MongoDB Atlas Connection String (see [MONGODB_SETUP.md](./MONGODB_SETUP.md)).

---

## Step 1: Create a Web Service on Render

1. Log in to your Render Dashboard.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing the project.
4. Configure the service settings:
   * **Name**: `nextask-api` (or custom name).
   * **Region**: Choose the closest region.
   * **Branch**: `main`.
   * **Root Directory**: `backend` (very important: since the backend lives in the `backend/` folder).
   * **Runtime**: `Node`.
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: Select the **Free** tier.

---

## Step 2: Configure Environment Variables

Click the **Environment** tab in your Render service settings and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `10000` | The port Render binds the service to (optional). |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB connection string. |
| `JWT_SECRET` | `your_production_secret_token` | A long, random string to secure session tokens. |
| `JWT_EXPIRES_IN` | `7d` | Session length. |
| `NODE_ENV` | `production` | Enables production optimizations. |
| `CLOUDINARY_CLOUD_NAME` | `your_cloudinary_name` | (Optional) Cloudinary name for attachments. |
| `CLOUDINARY_API_KEY` | `your_cloudinary_key` | (Optional) Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | `your_cloudinary_secret` | (Optional) Cloudinary Secret. |

---

## Step 3: Deploy the Web Service

1. Click **Deploy Web Service** at the bottom of the form.
2. Render will spin up the container, install packages, and boot the server.
3. Once completed successfully, the service status changes to **Live**.
4. Copy the public URL of your live service (e.g., `https://nextask-api.onrender.com`).
5. *Note: Under the Free tier, Render services sleep after 15 minutes of inactivity. The first request after a sleep period may take 30-50 seconds to boot up.*

---

## Step 4: Link with Frontend

Use this backend URL as `VITE_API_URL` when deploying the frontend to Vercel (see [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md)).
