# Frost Room ❄️

A minimalist digital lounge for collective presence. Anonymous silhouettes from around the world drift across an atmospheric frosted horizon.

## Features
- **Dynamic Themes**: Atmosphere transitions between Dawn, Day, Sunset, and Night based on your local time.
- **Location-Aware**: Automatically selects a city skyline closest to your real-world location.
- **Relative Depth**: Figure sizes are relative to their physical distance from you.
- **Atmosphere Controls**: Manually adjust density, mood, diffusion, and flow pace via the control panel.
- **Premium Design**: Smooth 3-second transitions and dynamic text contrast for perfect legibility.
- **Live Weather**: Real-time weather synchronization (Rain, Snow, Sun) with intensity levels.
- **Atmospheric Audio**: Immersive soundscapes including looping rain, wind, and dynamic crowd chatter that scales with user density.
- **Teleport**: Instantly jump to global cities via the Location dropdown to experience their real-time local weather.

## Run Locally

**Prerequisites:** Node.js

### Quick Start
1. Install dependencies:
   - Root: `npm install`
   - Server: `cd server && npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run both services:
   - `npm run dev` 
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3030`

## Deployment
When pushing to main, the CI/CD pipeline will automatically deploy both frontend and backend.

### Frontend deployment
Vercel project: https://vercel.com/wangqinxin2018-gmailcoms-projects/frost-room.

Visit the [deployed website](https://frost-room.vercel.app). 


### Backend deployment
This service is deployed on railway.com. Production URL: https://frost-room-production.up.railway.app.

If you want to modify deployment settings, you can [join](https://railway.com/invite/opfirmTOri9) the railway project.
