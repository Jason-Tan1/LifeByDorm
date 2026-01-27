# AWS Lambda & S3 Deployment Guide

This guide helps you deploy your **LifeByDorm** backend to **AWS Lambda** (serverless) and configure **AWS S3** for image storage.

## Architecture

- **Compute**: AWS Lambda (runs your Express code on-demand).
- **API Gateway**: Exposes your Lambda as an HTTP API.
- **Storage**: AWS S3 (stores user uploads/images).
- **Database**: MongoDB Atlas (external).

## Prerequisites

1.  **Node.js** and **npm** installed.
2.  **AWS CLI** installed and configured (`aws configure`).
3.  **Serverless Framework** installed globally:
    ```bash
    npm install -g serverless
    ```
    *Or you can use `npx serverless` commands.*

---

## Step 1: Install Dependencies

Naviage to your server directory and install the required packages for Lambda deployment:

```bash
cd my-app/server
npm install serverless-http
npm install --save-dev serverless-esbuild serverless-offline
```

## Step 2: Configure Environment

Ensure your `my-app/server/.env` file has the following variables:

```env
MONGODB_URI=mongodb+srv://...
ACCESS_TOKEN_SECRET=...
ADMIN_EMAILS=...
FRONTEND_URL=...
AWS_BUCKET_NAME=your-s3-bucket-name
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID & SECRET are optional on Lambda if using IAM (handled in serverless.yml)
```

## Step 3: Deployment

From the `my-app/server` directory, run:

```bash
serverless deploy
```

This will:
1.  Bundle your TypeScript code.
2.  Create the Lambda function.
3.  Create an API Gateway.
4.  Setup IAM roles for S3 access.

**Output**: You will see an `endpoint` URL (e.g., `https://xyz.execute-api.us-east-1.amazonaws.com/dev/`). **Use this URL as your new backend API URL in your Frontend.**

## Step 4: Update Frontend

In your frontend (`my-app/Dockerfile` or local `.env`), update `VITE_API_BASE` (or wherever you point to the backend) to the new Lambda URL.

## Step 5: S3 Bucket Setup

1.  Create an S3 bucket named `your-s3-bucket-name` (must be unique globally).
2.  **CORS Configuration**: Go to the Bucket -> Permissions -> CORS and add:
    ```json
    [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
    ```
    *(Replace `*` with your actual domain for production security)*

## Running Locally

You can test the lambda emulation locally:

```bash
serverless offline
```
This starts a local server on port 3000 that mimics Lambda.
