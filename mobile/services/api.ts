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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  
  console.log('Making authenticated request:', {
    url,
    method: options.method || 'GET',
    hasToken: !!token,
  });
  
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
 * GET /api/pick-requests/nearby?latitude={lat}&longitude={lng}&radius={radius}
 */
export async function getNearbyPickRequests(
  latitude: number,
  longitude: number,
  radius: number = 50000
): Promise<PickRequest[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
  });

  const response = await authenticatedFetch(`/api/pick-requests/nearby?${params}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get nearby pick requests' }));
    throw new Error(error.message || 'Failed to get nearby pick requests');
  }

  const data = await response.json();
  console.log('Nearby pick requests:', data);
  return data;
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

/**
 * Get my matches (approved/matched/picked requests)
 * GET /api/matches/my
 * Falls back to getting matches from MATCHED pick requests if endpoint is not available
 */
export async function getMyMatches(): Promise<Match[]> {
  try {
    console.log('Fetching matches from:', `${API_BASE}/api/matches/my`);
    const response = await authenticatedFetch('/api/matches/my');
    
    console.log('Matches response status:', response.status, response.statusText);
    
    if (!response.ok) {
      // If it's a 404, try fallback to get matches from pick requests
      if (response.status === 404) {
        console.warn('Endpoint /api/matches/my not found (404). Using fallback to get matches from pick requests.');
        return await getMyMatchesFallback();
      }
      
      // Try to get error message from response
      let errorMessage = 'Failed to get my matches';
      let errorData: any = null;
      
      try {
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        if (responseText) {
          errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
        console.log('Could not parse error response as JSON');
      }
      
      console.error('Error getting matches:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        url: `${API_BASE}/api/matches/my`,
        errorData,
      });
      
      throw new Error(errorMessage);
    }

    const matches = await response.json();
    console.log('Successfully fetched matches from backend:', matches);
    return matches;
  } catch (error: any) {
    console.error('Error fetching matches, trying fallback:', error);
    // Try fallback if main endpoint fails
    try {
      return await getMyMatchesFallback();
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Fallback: Get matches from MATCHED pick requests
 * This is used when /api/matches/my endpoint is not available
 */
async function getMyMatchesFallback(): Promise<Match[]> {
  try {
    console.log('Using fallback: Getting matches from pick requests...');
    const myPickRequests = await getMyPickRequests();
    const matchedRequests = myPickRequests.filter(pr => pr.status === 'MATCHED');
    
    console.log('Found matched pick requests:', matchedRequests.length);
    
    // Convert matched pick requests to match-like objects
    // Note: This is a simplified version - we don't have picker info from pick requests
    return matchedRequests.map(pr => ({
      matchId: pr.pickRequestId, // Temporary ID
      pickRequestId: pr.pickRequestId,
      pickerId: 0, // Unknown - would need backend to provide
      pickerName: 'Unknown', // Unknown - would need backend to provide
      requesterId: pr.userId,
      requesterName: pr.userName,
      status: 'ACCEPTED' as const, // Assume matched means accepted
      createdAt: pr.createdAt,
      approvedAt: pr.createdAt,
    }));
  } catch (err) {
    console.error('Error getting matches from pick requests fallback:', err);
    return [];
  }
}

