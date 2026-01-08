<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16qlRLd9rHnItx8M1eu8uoGEs0mLvO9xo

## Run Locally

**Prerequisites:** Node.js

### 1. Backend Server

1. Navigate to the server directory:
   `cd server`
2. Install dependencies:
   `npm install`
3. Start the server:
   `npm start`

The server will run on `http://localhost:3001`.

### 2. Frontend Application

1. Return to the root directory:
   `cd ..` (if inside `server/`)
2. Install dependencies:
   `npm install`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

The application will be accessible at `http://localhost:3000`.

