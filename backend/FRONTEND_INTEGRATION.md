# 🚀 Peek Me - Frontend Integration Guide

## Table of Contents
- [Overview](#overview)
- [Base URL & CORS](#base-url--cors)
- [Authentication Flow](#authentication-flow)
- [API Endpoints](#api-endpoints)
    - [Authentication](#1-authentication-endpoints)
    - [Pick Requests](#2-pick-request-endpoints)
    - [Matching System](#3-matching-endpoints)
    - [User Endpoints](#4-user-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Example Flows](#example-flows)
- [Testing with cURL](#testing-with-curl)

---

## Overview

**Peek Me** is a location-based social connection app where:
- **Requesters** (users who want to be picked up) create **Pick Requests**
- **Pickers** (users who want to pick someone) browse the map and send **Match Requests**
- When a match is **approved**, both users can proceed to meetup

### Key Concepts

| Term | Description |
|------|-------------|
| **Pick Request** | A post by a user wanting to be picked up (visible on map) |
| **Requester** | User who created the pick request |
| **Picker** | User who sends a match request to pick someone up |
| **Match** | Connection between picker and requester (requires approval) |
| **JWT Token** | Authentication token required for protected endpoints |

---

## Base URL & CORS

```
Base URL: http://localhost:8080/api
Production: https://your-domain.com/api
```

**CORS is enabled** for all origins (`*`), so you can call the API from any frontend framework.

---

## Authentication Flow

### 1️⃣ User Registration → 2️⃣ Login → 3️⃣ Get JWT Token → 4️⃣ Use Token in Headers

```mermaid
sequenceDiagram
    Frontend->>Backend: POST /api/auth/register
    Backend-->>Frontend: JWT Token + User Info
    Frontend->>Backend: POST /api/auth/login
    Backend-->>Frontend: JWT Token + User Info
    Frontend->>Backend: GET /api/users/me (with JWT)
    Backend-->>Frontend: User Profile
```

**Important**: Store the JWT token securely (e.g., `AsyncStorage`, `localStorage`) and include it in all protected API calls.

---

## API Endpoints

### 1. Authentication Endpoints

#### 📝 Register New User

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "alice@example.com",
  "password": "password123",
  "name": "Alice"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "alice@example.com",
  "name": "Alice"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123",
    "name": "Alice"
  }'
```

**Validation Rules**:
- Email must be unique
- Password minimum 8 characters
- Name is required

---

#### 🔐 Login Existing User

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "userId": 1,
  "email": "alice@example.com",
  "name": "Alice"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid email or password"
}
```

---

### 2. Pick Request Endpoints

#### ✨ Create Pick Request (Requester wants to be picked up)

**Endpoint**: `POST /api/pick-requests`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "activityType": "COFFEE",
  "subject": "Need a coffee buddy at Cafe Olimpico",
  "durationMinutes": 60,
  "latitude": 45.5088,
  "longitude": -73.5878
}
```

**Activity Types** (Enum):
- `COFFEE` ☕
- `WALK` 🚶
- `FOOD` 🍔
- `GAMING` 🎮
- `STUDY` 📚
- `MOVIE` 🎬
- `GYM` 💪
- `OTHER` 🤝

**Response** (200 OK):
```json
{
  "pickRequestId": 1,
  "userId": 64,
  "userName": "Alice",
  "activityType": "COFFEE",
  "subject": "Need a coffee buddy at Cafe Olimpico",
  "durationMinutes": 60,
  "latitude": 45.5088,
  "longitude": -73.5878,
  "status": "ACTIVE",
  "createdAt": "2024-01-15T10:30:00",
  "expiresAt": "2024-01-15T12:30:00"
}
```

**Status Values**:
- `ACTIVE` - Visible on map, waiting to be picked
- `MATCHED` - Someone sent a pick request
- `COMPLETED` - Meetup finished successfully
- `EXPIRED` - Time limit passed (2 hours)
- `CANCELLED` - User cancelled

**cURL Example**:
```bash
ALICE_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8080/api/pick-requests \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "COFFEE",
    "subject": "Coffee at Olimpico",
    "durationMinutes": 60,
    "latitude": 45.5088,
    "longitude": -73.5878
  }'
```

---

#### 🗺️ Get Nearby Pick Requests (Picker sees this on map)

**Endpoint**: `GET /api/pick-requests/nearby`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `latitude` | Double | ✅ Yes | - | Current user latitude |
| `longitude` | Double | ✅ Yes | - | Current user longitude |
| `radiusMeters` | Double | ❌ No | 5000 | Search radius in meters |

**Request Example**:
```
GET /api/pick-requests/nearby?latitude=45.5017&longitude=-73.5673&radiusMeters=5000
```

**Response** (200 OK):
```json
[
  {
    "pickRequestId": 1,
    "userId": 64,
    "userName": "Alice",
    "userAge": 25,
    "userBio": "Coffee enthusiast",
    "interests": ["coffee", "reading", "art"],
    "safetyScore": 85,
    "activityType": "COFFEE",
    "subject": "Need a coffee buddy at Cafe Olimpico",
    "durationMinutes": 60,
    "latitude": 45.5088,
    "longitude": -73.5878,
    "distanceMeters": 823.45,
    "createdAt": "2024-01-15T10:30:00"
  },
  {
    "pickRequestId": 2,
    "userId": 65,
    "userName": "Bob",
    "userAge": 28,
    "userBio": "Gamer looking for chill hangouts",
    "interests": ["gaming", "tech", "anime"],
    "safetyScore": 70,
    "activityType": "GAMING",
    "subject": "Looking for someone to check out new arcade",
    "durationMinutes": 120,
    "latitude": 45.5017,
    "longitude": -73.5673,
    "distanceMeters": 0,
    "createdAt": "2024-01-15T11:00:00"
  }
]
```

**Notes**:
- Only returns `ACTIVE` pick requests
- Excludes current user's own requests
- Results sorted by distance (closest first)
- Distance calculated using Haversine formula

**cURL Example**:
```bash
BOB_TOKEN="your_jwt_token_here"

curl -X GET "http://localhost:8080/api/pick-requests/nearby?latitude=45.5017&longitude=-73.5673&radiusMeters=5000" \
  -H "Authorization: Bearer $BOB_TOKEN"
```

---

#### 📋 Get My Pick Requests

**Endpoint**: `GET /api/pick-requests/my`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
[
  {
    "pickRequestId": 1,
    "userId": 64,
    "userName": "Alice",
    "activityType": "COFFEE",
    "subject": "Coffee at Olimpico",
    "durationMinutes": 60,
    "latitude": 45.5088,
    "longitude": -73.5878,
    "status": "MATCHED",
    "createdAt": "2024-01-15T10:30:00",
    "expiresAt": "2024-01-15T12:30:00"
  }
]
```

**cURL Example**:
```bash
curl -X GET http://localhost:8080/api/pick-requests/my \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

#### ❌ Cancel Pick Request

**Endpoint**: `DELETE /api/pick-requests/{id}`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (204 No Content):
```
(empty body)
```

**Validation**:
- Can only cancel your own pick requests
- Can only cancel if status is `ACTIVE`

**cURL Example**:
```bash
curl -X DELETE http://localhost:8080/api/pick-requests/1 \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

### 3. Matching Endpoints

#### 🤝 Send Pick Request (Picker chooses someone)

**Endpoint**: `POST /api/matches`

**Headers**:
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "pickRequestId": 1
}
```

**Response** (200 OK):
```json
{
  "matchId": 1,
  "pickRequestId": 1,
  "pickerId": 68,
  "pickerName": "Bob",
  "requesterId": 64,
  "requesterName": "Alice",
  "status": "PENDING",
  "createdAt": "2024-01-15T11:00:00",
  "approvedAt": null
}
```

**Match Status Values**:
- `PENDING` - Picker sent request, waiting for approval
- `ACCEPTED` - Requester approved the match
- `DECLINED` - Requester declined the match
- `COMPLETED` - Meetup finished successfully

**Side Effects**:
- Pick request status changes from `ACTIVE` → `MATCHED`
- Creates a new match with `PENDING` status
- Prevents duplicate match requests (unique constraint)

**cURL Example**:
```bash
BOB_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8080/api/matches \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pickRequestId": 1}'
```

**Error Cases**:
- Pick request not found → `404 Not Found`
- Pick request not `ACTIVE` → `400 Bad Request`
- Cannot pick your own request → `400 Bad Request`
- Already sent pick request → `409 Conflict`

---

#### ✅ Approve/Decline Match (Requester responds)

**Endpoint**: `PUT /api/matches/{matchId}/respond`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `approved` | Boolean | ✅ Yes | `true` to approve, `false` to decline |

**Request Example**:
```
PUT /api/matches/1/respond?approved=true
```

**Response - Approved** (200 OK):
```json
{
  "matchId": 1,
  "pickRequestId": 1,
  "pickerId": 68,
  "pickerName": "Bob",
  "requesterId": 64,
  "requesterName": "Alice",
  "status": "ACCEPTED",
  "createdAt": "2024-01-15T11:00:00",
  "approvedAt": "2024-01-15T11:05:00"
}
```

**Response - Declined** (200 OK):
```json
{
  "matchId": 1,
  "pickRequestId": 1,
  "pickerId": 68,
  "pickerName": "Bob",
  "requesterId": 64,
  "requesterName": "Alice",
  "status": "DECLINED",
  "createdAt": "2024-01-15T11:00:00",
  "approvedAt": null
}
```

**Side Effects**:
- **If approved**: Match status → `ACCEPTED`, pick request stays `MATCHED`
- **If declined**: Match status → `DECLINED`, pick request → `ACTIVE` (available again for others)

**cURL Example - Approve**:
```bash
ALICE_TOKEN="your_jwt_token_here"

curl -X PUT "http://localhost:8080/api/matches/1/respond?approved=true" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**cURL Example - Decline**:
```bash
curl -X PUT "http://localhost:8080/api/matches/1/respond?approved=false" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

**Error Cases**:
- Match not found → `404 Not Found`
- Not the requester → `403 Forbidden`
- Match not `PENDING` → `400 Bad Request`

---

### 4. User Endpoints

#### 👤 Get Current User Profile

**Endpoint**: `GET /api/users/me`

**Headers**:
```
Authorization: Bearer {jwt_token}
```

**Response** (200 OK):
```json
{
  "email": "alice@example.com",
  "message": "Authenticated successfully"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

---

## Data Models

### User
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  bio?: string;
  interests?: string[];
  safetyScore: number;      // 0-100
  completedMeetups: number;
  isVerified: boolean;
  createdAt: string;        // ISO 8601 format
}
```

### Pick Request
```typescript
interface PickRequest {
  pickRequestId: number;
  userId: number;
  userName: string;
  activityType: 'COFFEE' | 'WALK' | 'FOOD' | 'GAMING' | 'STUDY' | 'MOVIE' | 'GYM' | 'OTHER';
  subject: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  status: 'ACTIVE' | 'MATCHED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  expiresAt: string;
}
```

### Nearby Pick Request (Map View)
```typescript
interface NearbyPickRequest extends PickRequest {
  userAge?: number;
  userBio?: string;
  interests?: string[];
  safetyScore: number;
  distanceMeters: number;   // Distance from current user
}
```

### Match
```typescript
interface Match {
  matchId: number;
  pickRequestId: number;
  pickerId: number;
  pickerName: string;
  requesterId: number;
  requesterName: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  approvedAt?: string;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `204` | No Content | Successful deletion |
| `400` | Bad Request | Invalid input data |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., duplicate match) |
| `500` | Internal Server Error | Backend error |

### Error Response Format

```json
{
  "error": "Detailed error message here",
  "timestamp": "2024-01-15T11:00:00",
  "path": "/api/pick-requests"
}
```

### Common Errors

#### 401 Unauthorized - Missing Token
```json
{
  "error": "JWT token is missing"
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "error": "Invalid JWT token"
}
```

#### 403 Forbidden - Expired Token
```json
{
  "error": "JWT token has expired"
}
```

#### 400 Bad Request - Validation Error
```json
{
  "error": "Validation failed: Email is required"
}
```

---

## Example Flows

### Flow 1: User Wants to Be Picked Up (Pick Me)

```mermaid
sequenceDiagram
    participant App
    participant Backend
    
    App->>Backend: POST /api/auth/register
    Backend-->>App: JWT Token
    App->>Backend: POST /api/pick-requests (with location)
    Backend-->>App: Pick Request Created (status: ACTIVE)
    Note over App,Backend: User appears on map for pickers
    App->>Backend: GET /api/pick-requests/my
    Backend-->>App: List of my pick requests
```

**Steps**:
1. User registers/logs in → Get JWT token
2. User creates pick request with location
3. Pick request appears on map with `ACTIVE` status
4. User can view their active pick requests

---

### Flow 2: User Wants to Pick Someone (Pick)

```mermaid
sequenceDiagram
    participant Picker
    participant Backend
    participant Requester
    
    Picker->>Backend: GET /api/pick-requests/nearby
    Backend-->>Picker: List of nearby pick requests
    Picker->>Backend: POST /api/matches (pickRequestId)
    Backend-->>Picker: Match Created (status: PENDING)
    Backend-->>Requester: Notification (match request received)
    Requester->>Backend: PUT /api/matches/1/respond?approved=true
    Backend-->>Requester: Match Updated (status: ACCEPTED)
    Backend-->>Picker: Notification (match approved)
    Note over Picker,Requester: Both users can now proceed to meetup
```

**Steps**:
1. Picker views map → Calls `/api/pick-requests/nearby`
2. Picker selects a user → Calls `/api/matches` (creates `PENDING` match)
3. Pick request status changes to `MATCHED`
4. Requester approves → Calls `/api/matches/{id}/respond?approved=true`
5. Match status changes to `ACCEPTED`
6. Both users can now chat/meetup

---

### Flow 3: Complete Match Lifecycle

```mermaid
graph LR
    A[Pick Request: ACTIVE] -->|Picker sends request| B[Pick Request: MATCHED]
    B -->|Requester approves| C[Match: ACCEPTED]
    B -->|Requester declines| D[Pick Request: ACTIVE]
    C -->|Meetup happens| E[Pick Request: COMPLETED]
```

---

## Testing with cURL

### Complete Test Scenario

```bash
#!/bin/bash

# === 1. Register Users ===
echo "1. Registering Alice (Requester)..."
ALICE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123",
    "name": "Alice"
  }')

ALICE_TOKEN=$(echo $ALICE_RESPONSE | jq -r '.token')
echo "Alice Token: $ALICE_TOKEN"

echo "\n2. Registering Bob (Picker)..."
BOB_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "password": "password123",
    "name": "Bob"
  }')

BOB_TOKEN=$(echo $BOB_RESPONSE | jq -r '.token')
echo "Bob Token: $BOB_TOKEN"

# === 2. Alice Creates Pick Request ===
echo "\n3. Alice creates pick request..."
curl -s -X POST http://localhost:8080/api/pick-requests \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityType": "COFFEE",
    "subject": "Need a coffee buddy at Cafe Olimpico",
    "durationMinutes": 60,
    "latitude": 45.5088,
    "longitude": -73.5878
  }' | jq

# === 3. Bob Searches Nearby ===
echo "\n4. Bob searches for nearby pick requests..."
curl -s -X GET "http://localhost:8080/api/pick-requests/nearby?latitude=45.5017&longitude=-73.5673&radiusMeters=5000" \
  -H "Authorization: Bearer $BOB_TOKEN" | jq

# === 4. Bob Sends Pick Request ===
echo "\n5. Bob sends pick request to Alice..."
curl -s -X POST http://localhost:8080/api/matches \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pickRequestId": 1}' | jq

# === 5. Alice Approves Match ===
echo "\n6. Alice approves Bob's pick request..."
curl -s -X PUT "http://localhost:8080/api/matches/1/respond?approved=true" \
  -H "Authorization: Bearer $ALICE_TOKEN" | jq

echo "\n✅ Test complete! Match created and approved."
```

**Save as**: `test-api.sh`

**Run**:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Frontend Implementation Tips

### 1. Store JWT Token Securely

**React Native** (with AsyncStorage):
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After login/register
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
await AsyncStorage.setItem('jwt_token', data.token);
await AsyncStorage.setItem('user', JSON.stringify(data));
```

**React Web** (with localStorage):
```typescript
const data = await response.json();
localStorage.setItem('jwt_token', data.token);
localStorage.setItem('user', JSON.stringify(data));
```

---

### 2. Create API Service with Axios

```typescript
// api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - redirect to login
      await AsyncStorage.removeItem('jwt_token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 3. Example API Calls

**Create Pick Request**:
```typescript
import api from './api';

const createPickRequest = async (data: {
  activityType: string;
  subject: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
}) => {
  try {
    const response = await api.post('/pick-requests', data);
    return response.data;
  } catch (error) {
    console.error('Error creating pick request:', error);
    throw error;
  }
};
```

**Get Nearby Pick Requests**:
```typescript
const getNearbyPickRequests = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000
) => {
  try {
    const response = await api.get('/pick-requests/nearby', {
      params: { latitude, longitude, radiusMeters },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby requests:', error);
    throw error;
  }
};
```

**Send Pick Request**:
```typescript
const sendPickRequest = async (pickRequestId: number) => {
  try {
    const response = await api.post('/matches', { pickRequestId });
    return response.data;
  } catch (error) {
    console.error('Error sending pick request:', error);
    throw error;
  }
};
```

**Approve Match**:
```typescript
const respondToMatch = async (matchId: number, approved: boolean) => {
  try {
    const response = await api.put(`/matches/${matchId}/respond`, null, {
      params: { approved },
    });
    return response.data;
  } catch (error) {
    console.error('Error responding to match:', error);
    throw error;
  }
};
```

---

### 4. Display Users on Mapbox

```typescript
import Mapbox, { MapView, ShapeSource, SymbolLayer } from '@rnmapbox/maps';
import { featureCollection, point } from '@turf/helpers';

const MapScreen = () => {
  const [pickRequests, setPickRequests] = useState([]);

  useEffect(() => {
    const fetchNearby = async () => {
      const location = await Location.getCurrentPositionAsync();
      const data = await getNearbyPickRequests(
        location.coords.latitude,
        location.coords.longitude
      );
      setPickRequests(data);
    };
    fetchNearby();
  }, []);

  // Convert pick requests to GeoJSON
  const userPoints = featureCollection(
    pickRequests.map((pr) =>
      point([pr.longitude, pr.latitude], {
        id: pr.pickRequestId,
        name: pr.userName,
        activity: pr.activityType,
      })
    )
  );

  return (
    <MapView style={{ flex: 1 }}>
      <ShapeSource id="pickRequests" shape={userPoints}>
        <SymbolLayer
          id="pickRequestMarkers"
          style={{
            iconImage: 'marker-15',
            iconSize: 1.5,
          }}
        />
      </ShapeSource>
    </MapView>
  );
};
```

---

## Summary

### Core Endpoints You'll Use Most

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/register` | POST | Create account | ❌ No |
| `/api/auth/login` | POST | Get JWT token | ❌ No |
| `/api/pick-requests` | POST | Create pick request | ✅ Yes |
| `/api/pick-requests/nearby` | GET | Get map data | ✅ Yes |
| `/api/matches` | POST | Send pick request | ✅ Yes |
| `/api/matches/{id}/respond` | PUT | Approve/decline | ✅ Yes |

### Authentication Header Format

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzYzODIyNTYx...
```

### Key Validation Rules

- JWT tokens expire after **24 hours** (86400000 ms)
- Pick requests expire after **2 hours** from creation
- Cannot pick your own request
- Cannot send duplicate pick requests
- Only requester can approve/decline matches

---

## Need Help?

If you encounter issues:
1. Check that JWT token is included in headers
2. Verify token hasn't expired (24 hours from login)
3. Ensure request body matches expected format
4. Check backend logs for detailed error messages

**Backend logs** are set to `DEBUG` level for:
- `org.hibernate.SQL` - See all database queries
- `org.springframework.security` - See authentication flow

---

🎉 **Happy coding!** If you need any clarification, check the [backend source code](backend/src/main/java/com/oddo/hackaton/backend/controller/) or ask the backend team.