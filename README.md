# Frost Room ❄️

A minimalist digital lounge for collective presence. Anonymous silhouettes from around the world drift across an atmospheric frosted horizon.

## Features
- **Dynamic Themes**: Atmosphere transitions between Dawn, Day, Sunset, and Night based on your local time.
- **Location-Aware**: Automatically selects a city skyline closest to your real-world location.
- **Relative Depth**: Figure sizes are relative to their physical distance from you.
- **Atmosphere Controls**: Manually adjust density, mood, diffusion, and flow pace via the control panel.
- **Premium Design**: Smooth 3-second transitions and dynamic text contrast for perfect legibility.

## Run Locally

**Prerequisites:** Node.js

### 1. Backend
- `cd server`
- `npm install`
- `npm start` (runs on `http://localhost:3030`)

### 2. Frontend
- From root: `npm install`
- Set `GEMINI_API_KEY` in `.env.local`
- `npm run dev` (runs on `http://localhost:3000`)

## Deployment
When pushing to main, the CI/CD pipeline will automatically deploy both frontend and backend.

### Frontend deployment
Vercel project: https://vercel.com/wangqinxin2018-gmailcoms-projects/frost-room.

Visit the [deployed website](https://frost-room.vercel.app). 


### Backend deployment
This service is deployed on railway.com. Production URL: https://frost-room-production.up.railway.app.

If you want to modify deployment settings, you can [join](https://railway.com/invite/opfirmTOri9) the railway project.
