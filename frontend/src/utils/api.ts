import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request/response interceptors for debugging
api.interceptors.request.use(
  config => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Response error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const getAuthUrl = async () => {
  try {
    const response = await api.get('/api/login');
    return response.data.authUrl;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

export const handleCallback = async (code: string) => {
  try {
    console.log('Sending code to backend for token exchange...');
    const response = await api.post('/api/callback', { code });
    console.log('Token exchange successful');
    return response.data;
  } catch (error) {
    console.error('Error handling callback:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post('/api/refresh-token');
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

export const logoutApi = async () => {
  try {
    const response = await api.post('/api/logout');
    return response.data;
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// User data functions
export const getUserProfile = async (token: string) => {
  try {
    console.log('Fetching user profile with token...');
    if (!token) {
      throw new Error('No access token provided for user profile fetch');
    }
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const response = await api.get('/api/user-profile');
    console.log('User profile fetched successfully');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return a default user object with minimal information
    // This prevents the app from crashing when profile fetch fails
    return {
      id: 'unknown',
      display_name: 'Spotify User',
      images: [],
      email: ''
    };
  }
};

export const getTopItems = async (
  token: string,
  type: 'artists' | 'tracks',
  timeRange: 'short_term' | 'medium_term' | 'long_term',
  limit: number = 20
) => {
  try {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const response = await api.get('/api/top-items', {
      params: { type, timeRange, limit }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching top ${type}:`, error);
    throw error;
  }
};

// Collage generation
export const generateCollage = async (
  token: string,
  type: 'artists' | 'tracks',
  timeRange: 'short_term' | 'medium_term' | 'long_term',
  limit: number = 20,
  collageSize: string = '3x3'
) => {
  try {
    console.log(`Generating collage for ${type}, time range: ${timeRange}, limit: ${limit}`);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const response = await api.post('/api/generate-collage', {
      type,
      timeRange,
      limit,
      collageSize
    });
    console.log('Collage data received:', response.data.images.length);
    return response.data;
  } catch (error) {
    console.error('Error generating collage:', error);
    throw error;
  }
};

export default api; 