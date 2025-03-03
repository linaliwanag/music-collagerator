# Spotify Collage Generator

A web application that generates collages of album/artist artwork based on a user's Spotify listening history.

## Features

- Spotify authentication using OAuth
- Generate collages from top artists or tracks
- Customizable time periods (4 weeks, 6 months, all time)
- Multiple grid sizes (3x3, 4x4, 5x5)
- Download collages as PNG images
- Responsive design

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Authentication**: Spotify OAuth

## Prerequisites

- Node.js (v14 or higher)
- Spotify Developer account

## Setup

### Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Set the Redirect URI to `http://localhost:3000/callback`
4. Note your Client ID and Client Secret

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:

   ```
   PORT=5000
   CLIENT_URL=http://localhost:3000
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   REDIRECT_URI=http://localhost:3000/callback
   NODE_ENV=development
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the frontend development server:

   ```
   npm run dev
   ```

4. Open your browser and go to `http://localhost:3000`

## Usage

1. Login with your Spotify account
2. Select content type (artists or tracks)
3. Choose time period (last 4 weeks, last 6 months, all time)
4. Select grid size (3x3, 4x4, 5x5)
5. Generate your collage
6. Download the collage as a PNG image

## License

MIT
