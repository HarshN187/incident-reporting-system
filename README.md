# Incident Reporting System — Quick Setup

This repository contains a full-stack Incident Reporting System with separate `client` (React + Vite + TypeScript) and `server` (Node/Express + TypeScript) folders.

## Prerequisites

- Node.js (LTS, >=16)
- npm (or yarn/pnpm)
- MongoDB (local or a connection URI)

## Environment Variables

Create a `.env` file in the `server` folder with at least the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/incident-db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

For the client, create `client/.env` (Vite) if you need to override API URL:

```
VITE_API_URL=http://localhost:5000/api/v1
```

Adjust names and values to suit your environment.

## Install Dependencies

Open two terminals (one for server, one for client) and run:

```bash
cd server
npm install

cd ../client
npm install
```

## Run in Development

Start server (watch mode if available):

```bash
cd server
npm run dev
```

Start client dev server:

```bash
cd client
npm run dev
```

The client typically runs on `http://localhost:5173` and the server on the port set in `server/.env` (default `5000`).

## Build for Production

Build the client:

```bash
cd client
npm run build
```

Then build/run the server (if build scripts exist):

```bash
cd server
npm run build
npm start
```

Alternatively serve the client `dist` directory with any static server (e.g., `serve -s client/dist`). If the server is configured to serve the client build, copy `client/dist` into the expected static directory.

## File Uploads / Storage

Uploaded evidence files are stored under `server/uploads/evidence` by default. Ensure the `uploads` directory exists and is writable by the server process.

## Database

If using a local MongoDB, ensure MongoDB is running. Use the `MONGO_URI` environment variable to point to your database.

## Common Commands Summary

```
# Install
cd server && npm install
cd client && npm install

# Dev (two terminals)
cd server && npm run dev
cd client && npm run dev

# Build
cd client && npm run build
cd server && npm run build && npm start
```

# incident-reporting-system
