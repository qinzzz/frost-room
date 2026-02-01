# Deploy
When pushing to main, the CI/CD pipeline will deploy both frontend and backend automatically.

## Backend deployment

This service is deployed on railway.com. Production URL: https://frost-room-production.up.railway.app.

If you want to modify deployment settings, you can join the railway project: https://railway.com/invite/opfirmTOri9.

## Frontend deployment

Vercel project: https://vercel.com/wangqinxin2018-gmailcoms-projects/frost-room.
Url: https://frost-room.vercel.app. 


# Run Locally

**Prerequisites:** Node.js

### 1. Backend Server

1. Navigate to the server directory:
   `cd server`
2. Install dependencies:
   `npm install`
3. Start the server:
   `npm start`

The server will run on `http://localhost:3030`.

### 2. Frontend Application

1. Return to the root directory:
   `cd ..` (if inside `server/`)
2. Install dependencies:
   `npm install`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   `npm run dev`

The application will be accessible at `http://localhost:3000`.

