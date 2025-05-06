require("dotenv").config();
const express = require("express");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI || "http://localhost:3000/callback"
});

// Test Route
app.get("/", (req, res) => {
  res.send("Spotify Collage Generator Backend is running!");
});

// Spotify Auth Routes
app.get("/api/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read"
  ];
  
  res.json({
    authUrl: spotifyApi.createAuthorizeURL(scopes)
  });
});

app.post("/api/callback", async (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    console.error('No authorization code provided');
    return res.status(400).json({ error: "No authorization code provided" });
  }
  
  console.log('Received authorization code:', code.substring(0, 10) + '...');
  
  try {
    // Clean up the code in case it has any whitespace or unwanted characters
    const cleanCode = code.trim();
    
    const data = await spotifyApi.authorizationCodeGrant(cleanCode);
    console.log('Token exchange successful');
    
    // Set access token and refresh token
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    
    // Log token details (excluding actual token values for security)
    console.log('Access token received with expiry:', data.body.expires_in);
    console.log('Refresh token received:', data.body.refresh_token ? 'Yes' : 'No');
    
    res.cookie("refreshToken", data.body.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    });
    
    res.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error("Error during callback:", error.message);
    
    // Check for specific Spotify API errors
    if (error.body && error.body.error) {
      console.error("Spotify API error:", error.body.error);
      return res.status(400).json({ 
        error: "Authorization failed", 
        details: `Spotify error: ${error.body.error}` 
      });
    }
    
    if (error.response) {
      console.error("Spotify API response error:", error.response.data);
    }
    
    res.status(400).json({ error: "Authorization failed", details: error.message });
  }
});

// API Routes for fetching user data
app.get("/api/user-profile", async (req, res) => {
  const accessToken = req.headers.authorization?.split(' ')[1];
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token provided" });
  }
  
  console.log('Fetching user profile with token');
  
  try {
    // Set the access token for this request
    spotifyApi.setAccessToken(accessToken);
    
    const data = await spotifyApi.getMe();
    console.log(`User profile fetched: ${data.body.display_name}`);
    
    res.json(data.body);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    
    // Check for specific Spotify API errors
    if (error.body && error.body.error) {
      console.error("Spotify API error:", error.body.error);
      return res.status(400).json({ 
        error: "Failed to fetch user profile", 
        details: `Spotify error: ${error.body.error}` 
      });
    }
    
    if (error.response) {
      console.error("Spotify API response error:", error.response.data);
    }
    
    res.status(400).json({ error: "Failed to fetch user profile", details: error.message });
  }
});

app.get("/api/top-items", async (req, res) => {
  const { type, timeRange, limit } = req.query;
  const accessToken = req.headers.authorization?.split(' ')[1];
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token provided" });
  }
  
  if (!type || !['artists', 'tracks'].includes(type)) {
    return res.status(400).json({ error: "Invalid type parameter. Must be 'artists' or 'tracks'" });
  }
  
  console.log(`Fetching top ${type}, time range: ${timeRange}, limit: ${limit}`);
  
  // Set the access token for this request
  spotifyApi.setAccessToken(accessToken);
  
  try {
    let data;
    // Use the correct method based on the type
    if (type === 'artists') {
      data = await spotifyApi.getMyTopArtists({
        time_range: timeRange || "medium_term",
        limit: limit || 20
      });
    } else {
      data = await spotifyApi.getMyTopTracks({
        time_range: timeRange || "medium_term",
        limit: limit || 20
      });
    }
    
    console.log(`Successfully fetched ${data.body.items.length} ${type}`);
    res.json(data.body);
  } catch (error) {
    console.error(`Error fetching top ${type}:`, error.message);
    if (error.response) {
      console.error("Spotify API response error:", error.response.data);
    }
    res.status(400).json({ error: `Failed to fetch top ${type}`, details: error.message });
  }
});

// Refresh token endpoint
app.post("/api/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token" });
  }
  
  spotifyApi.setRefreshToken(refreshToken);
  
  try {
    const data = await spotifyApi.refreshAccessToken();
    res.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in
    });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    res.status(400).json({ error: "Failed to refresh token" });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  // Clear the refresh token cookie
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Successfully logged out" });
});

// Collage generation endpoint
app.post("/api/generate-collage", async (req, res) => {
  const { type, timeRange, limit, collageSize } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];
  
  if (!accessToken) {
    return res.status(401).json({ error: "No access token provided" });
  }
  
  if (!type || !['artists', 'tracks'].includes(type)) {
    return res.status(400).json({ error: "Invalid type parameter. Must be 'artists' or 'tracks'" });
  }
  
  console.log(`Generating collage for ${type}, time range: ${timeRange}, limit: ${limit}, size: ${collageSize}`);
  
  // Set the access token for this request
  spotifyApi.setAccessToken(accessToken);
  
  try {
    // Fetch top items based on the parameters
    let data;
    if (type === 'artists') {
      data = await spotifyApi.getMyTopArtists({
        time_range: timeRange || "medium_term",
        limit: limit || 20
      });
    } else {
      data = await spotifyApi.getMyTopTracks({
        time_range: timeRange || "medium_term",
        limit: limit || 20
      });
    }
    
    console.log(`Successfully fetched ${data.body.items.length} ${type}`);
    
    // Extract image URLs from the API response
    const images = data.body.items.map(item => {
      if (type === 'artists') {
        // For artists, select the highest quality image available
        const bestImage = item.images && item.images.length > 0 
          ? item.images.sort((a, b) => b.width - a.width)[0] 
          : null;
            
        return {
          name: item.name,
          imageUrl: bestImage?.url || '',
          spotifyUrl: item.external_urls.spotify,
          id: item.id
        };
      } else if (type === 'tracks') {
        // For tracks, select the highest quality album image
        const albumImages = item.album.images || [];
        const bestImage = albumImages.length > 0 
          ? albumImages.sort((a, b) => b.width - a.width)[0] 
          : null;
            
        return {
          name: item.name,
          artist: item.artists[0].name,
          imageUrl: bestImage?.url || '',
          spotifyUrl: item.external_urls.spotify,
          id: item.id
        };
      }
    });
    
    // Return the image data to the frontend for collage generation
    res.json({
      success: true,
      images,
      collageSize,
      type,
      timeRange,
      attribution: {
        spotifyLogo: "https://developer.spotify.com/assets/branding-guidelines/logo@2x.png",
        disclaimer: "This collage is generated using Spotify content and is for personal use only. All content belongs to Spotify."
      }
    });
  } catch (error) {
    console.error("Error generating collage:", error.message);
    if (error.response) {
      console.error("Spotify API response error:", error.response.data);
    }
    res.status(400).json({ error: "Failed to generate collage", details: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
