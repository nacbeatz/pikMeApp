import { API_BASE } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface PickRequest {
  pickRequestId: number;
  userId: number;
  userName: string;
  userAge?: number;
  userBio?: string;
  interests?: string[];
  safetyScore?: number;
  activityType: string;
  subject?: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  status: 'ACTIVE' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt?: string;
}

export interface Match {
  matchId: number;
  pickRequestId: number;
  pickerId: number;
  pickerName: string;
  requesterId: number;
  requesterName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  approvedAt?: string | null;
}

export interface UserProfile {
  email: string;
  message: string;
}

// Helper function to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

// Helper function to make authenticated requests
async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers,
  });
}

// API Functions

/**
 * Get current user profile
 * GET /api/users/me
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await authenticatedFetch('/api/users/me');
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get user profile' }));
    throw new Error(error.message || 'Failed to get user profile');
  }

  return response.json();
}

/**
 * Get nearby pick requests for the map
 * GET /api/pick-requests/nearby?latitude={lat}&longitude={lng}&radiusMeters={radius}
 */
export async function getNearbyPickRequests(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
): Promise<PickRequest[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radiusMeters: radiusMeters.toString(),
  });

  const response = await authenticatedFetch(`/api/pick-requests/nearby?${params}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get nearby pick requests' }));
    throw new Error(error.message || 'Failed to get nearby pick requests');
  }

  return response.json();
}

/**
 * Send a pick request (when clicking "Pick" button)
 * POST /api/matches
 * Body: { "pickRequestId": number }
 */
export async function sendPickRequest(pickRequestId: number): Promise<Match> {
  const response = await authenticatedFetch('/api/matches', {
    method: 'POST',
    body: JSON.stringify({ pickRequestId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to send pick request' }));
    throw new Error(error.message || 'Failed to send pick request');
  }

  return response.json();
}

/**
 * Respond to a match (approve or decline)
 * PUT /api/matches/{matchId}/respond?approved={true|false}
 */
export async function respondToMatch(
  matchId: number,
  approved: boolean
): Promise<Match> {
  const response = await authenticatedFetch(
    `/api/matches/${matchId}/respond?approved=${approved}`,
    {
      method: 'PUT',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to respond to match' }));
    throw new Error(error.message || 'Failed to respond to match');
  }

  return response.json();
}

/**
 * Create a pick request
 * POST /api/pick-requests
 */
export async function createPickRequest(data: {
  activityType: string;
  subject?: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
}): Promise<PickRequest> {
  const response = await authenticatedFetch('/api/pick-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create pick request' }));
    throw new Error(error.message || 'Failed to create pick request');
  }

  return response.json();
}

/**
 * Get my pick requests
 * GET /api/pick-requests/my
 */
export async function getMyPickRequests(): Promise<PickRequest[]> {
  const response = await authenticatedFetch('/api/pick-requests/my');
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get my pick requests' }));
    throw new Error(error.message || 'Failed to get my pick requests');
  }

  return response.json();
}

