# MongoDB Atlas Setup Guide

This guide will walk you through setting up a free-tier MongoDB Atlas cluster for your **NexTask** application.

## Prerequisites
* A web browser.
* A free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

---

## Step 1: Create a Database Cluster

1. Sign in to your MongoDB Atlas dashboard.
2. Click **Create** to deploy a new database.
3. Select the **M0 (Free)** shared cluster option.
4. Choose your preferred Cloud Provider (e.g., AWS) and Region (choose the one closest to you).
5. Click **Create Deployment**.

---

## Step 2: Configure Database Access Security

Atlas will prompt you to set up security credentials:

### 1. Create a Database User
* Enter a **Username** (e.g., `nextask_admin`).
* Choose a secure **Password** (click "Autogenerate Secure Password" and copy it).
* Click **Create Database User**.
* *Note: Keep these credentials safe; you will need them for your connection string.*

### 2. Configure IP Access List (Network Access)
* To allow connections from any hosting environment (like Render and local development), click **Add My Current IP Address** or add `0.0.0.0/0` (allow access from anywhere).
* Click **Add Entry**.
* *For production deployment, it is highly recommended to only allow specific server IPs (e.g., Render outbound IPs).*

---

## Step 3: Retrieve the Connection String

1. Go to the **Database** tab in the sidebar.
2. Click **Connect** next to your cluster.
3. Select **Drivers** (under Connect to your application).
4. Copy the connection string provided. It should look like this:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

---

## Step 4: Inject the Connection String into NexTask

1. Open `/backend/.env` on your system.
2. Replace `MONGO_URI` with your copied connection string.
3. Replace `<username>` with your database username.
4. Replace `<password>` with the password you generated in Step 2.
5. Replace `Cluster0` or base path with your database name (e.g., `/nextask` right before the `?retryWrites=...` part).
   
   Example:
   ```env
   MONGO_URI=mongodb+srv://nextask_admin:MySuperSecretPassword@cluster0.abcde.mongodb.net/nextask?retryWrites=true&w=majority
   ```

---

## Step 5: Test the Connection
Run the verification script in the backend directory:
```bash
cd backend
node verify.js
```
If configured correctly, you should see:
```text
MongoDB Connected: cluster0-shard-00-00.abcde.mongodb.net
--- Verification: ALL TESTS PASSED ---
```
