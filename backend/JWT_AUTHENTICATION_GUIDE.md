# JWT Authentication Guide - Spring Boot + PostgreSQL

## Overview

This backend implements JWT (JSON Web Token) authentication with PostgreSQL database. Users can register and login, and receive a JWT token for authenticated requests.

## Architecture

```
┌─────────────┐
│   Client    │ (React Native App)
└──────┬──────┘
       │ HTTP Request (email, password, name)
       ▼
┌─────────────────────────────────────┐
│      AuthController                 │
│  POST /api/auth/register            │
│  POST /api/auth/login               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      AuthService                    │
│  - register()                       │
│  - login()                          │
└──────┬──────────────────────────────┘
       │
       ├──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│ UserRepository│  │PasswordEncoder│  │  JwtUtils  │
│ (PostgreSQL) │  │  (BCrypt)    │  │ (Generate) │
└─────────────┘  └──────────────┘  └─────────────┘
```

## Database Schema (PostgreSQL)

### Users Table

The `users` table is automatically created by Hibernate when the app starts:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    bio TEXT,
    interests TEXT[],
    safety_score INTEGER DEFAULT 50,
    completed_meetups INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Registration Flow

### 1. Client Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### 2. Backend Processing

**AuthController** → **AuthService.register()**:

1. **Check if email exists**: `userRepository.existsByEmail(email)`
2. **Create new User entity**:
   - Hash password with BCrypt: `passwordEncoder.encode(password)`
   - Set default values (safetyScore=50, completedMeetups=0, isVerified=false)
   - Set createdAt timestamp
3. **Save to PostgreSQL**: `userRepository.save(user)`
4. **Generate JWT token**: `jwtUtils.generateTokenFromUsername(email)`
5. **Return AuthResponse** with token

### 3. Response

```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA...",
  "type": "Bearer",
  "userId": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

## Login Flow

### 1. Client Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Backend Processing

**AuthController** → **AuthService.login()**:

1. **Authenticate user**: `authenticationManager.authenticate()`
   - Uses `UserDetailsServiceImpl` to load user from database
   - Compares password with BCrypt: `passwordEncoder.matches()`
2. **Generate JWT token**: `jwtUtils.generateJwtToken(authentication)`
3. **Get user details**: `userRepository.findByEmail(email)`
4. **Return AuthResponse** with token

### 3. Response

```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA...",
  "type": "Bearer",
  "userId": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

## JWT Token Structure

### Token Generation (JwtUtils.java)

```java
String token = Jwts.builder()
    .subject(username)                    // User email
    .issuedAt(now)                        // Current time
    .expiration(expiryDate)                // Now + 24 hours (86400000ms)
    .signWith(key, Jwts.SIG.HS512)        // HMAC SHA-512 algorithm
    .compact();
```

### Token Payload

```json
{
  "sub": "user@example.com",    // Subject (email)
  "iat": 1704067200,             // Issued at (timestamp)
  "exp": 1704153600              // Expiration (timestamp)
}
```

### Token Configuration

In `application.properties`:
```properties
jwt.secret=peekme-hackathon-secret-key-change-in-production-256-bits-minimum-length-required
jwt.expiration=86400000  # 24 hours in milliseconds
```

## Using JWT Token

### Protected Endpoints

After login/register, include the token in requests:

```http
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### JWT Filter (JwtAuthenticationFilter.java)

1. **Extract token** from `Authorization` header
2. **Validate token** using `jwtUtils.validateJwtToken()`
3. **Extract username** (email) from token
4. **Load UserDetails** from database
5. **Set authentication** in SecurityContext

## Key Components

### 1. User Entity (User.java)

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;  // Hashed with BCrypt
    
    @Column(nullable = false)
    private String name;
    
    // ... other fields
}
```

### 2. UserRepository (UserRepository.java)

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### 3. AuthService (AuthService.java)

- **register()**: Creates new user, hashes password, saves to DB, generates JWT
- **login()**: Authenticates user, generates JWT

### 4. JwtUtils (JwtUtils.java)

- **generateJwtToken()**: Creates JWT from Authentication
- **generateTokenFromUsername()**: Creates JWT from email
- **validateJwtToken()**: Validates token signature and expiration
- **getUsernameFromJwtToken()**: Extracts email from token

### 5. SecurityConfig (SecurityConfig.java)

- Configures Spring Security
- Sets up password encoder (BCrypt)
- Configures JWT filter
- Allows `/api/auth/**` without authentication
- Requires authentication for all other endpoints

## Password Security

### BCrypt Hashing

Passwords are hashed using BCrypt before saving:

```java
String hashedPassword = passwordEncoder.encode("password123");
// Result: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### Password Verification

During login, password is verified:

```java
boolean matches = passwordEncoder.matches("password123", hashedPassword);
```

## Database Connection

### Configuration (application.properties)

```properties
# PostgreSQL Database
spring.datasource.url=jdbc:postgresql://localhost:5432/peekme
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update  # Auto-create/update tables
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### Setup PostgreSQL

1. **Install PostgreSQL** (if not installed)
2. **Create database**:
   ```sql
   CREATE DATABASE peekme;
   ```
3. **Update credentials** in `application.properties`
4. **Run application** - tables will be created automatically

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Protected Endpoint:**
```bash
curl -X GET http://localhost:8080/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

1. **Register**: POST to `http://localhost:8080/api/auth/register`
2. **Copy token** from response
3. **Login**: POST to `http://localhost:8080/api/auth/login`
4. **Use token**: Add to Headers → `Authorization: Bearer {token}`

## Error Handling

### Common Errors

1. **Email already exists** (Registration):
   ```json
   {
     "error": "Email already in use"
   }
   ```

2. **Invalid credentials** (Login):
   ```json
   {
     "error": "Bad credentials"
   }
   ```

3. **Invalid/Expired token**:
   ```json
   {
     "error": "Unauthorized"
   }
   ```

## Security Best Practices

1. ✅ **Password hashing**: BCrypt with salt
2. ✅ **JWT expiration**: 24 hours
3. ✅ **HTTPS**: Use in production
4. ✅ **Secret key**: Change default secret in production
5. ✅ **CORS**: Configured for cross-origin requests
6. ✅ **SQL injection**: Protected by JPA/Hibernate

## File Structure

```
backend/
├── src/main/java/com/oddo/hackaton/backend/
│   ├── controller/
│   │   └── AuthController.java          # Register/Login endpoints
│   ├── service/
│   │   └── AuthService.java             # Business logic
│   ├── repository/
│   │   └── UserRepository.java          # Database operations
│   ├── model/
│   │   ├── entity/
│   │   │   └── User.java                # User entity (PostgreSQL table)
│   │   └── dto/
│   │       ├── request/
│   │       │   ├── RegisterRequest.java
│   │       │   └── LoginRequest.java
│   │       └── reponse/
│   │           └── AuthResponse.java
│   ├── security/
│   │   ├── JwtUtils.java                # JWT generation/validation
│   │   ├── JwtAuthenticationFilter.java # JWT filter
│   │   └── UserDetailsServiceImpl.java   # Load user from DB
│   └── config/
│       └── SecurityConfig.java           # Spring Security config
└── src/main/resources/
    └── application.properties            # Database & JWT config
```

## Next Steps

1. **Update mobile app** to call these endpoints
2. **Store JWT token** in AsyncStorage
3. **Include token** in API requests
4. **Handle token expiration** and refresh
5. **Add email verification** (optional)
6. **Add password reset** (optional)

