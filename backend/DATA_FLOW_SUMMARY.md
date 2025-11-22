# Data Flow: Mobile App → Spring Boot → PostgreSQL with JWT

## Quick Summary

Your backend **already implements** JWT authentication with PostgreSQL! Here's how it works:

## Registration Flow

```
Mobile App (auth.tsx)
    ↓
POST /api/auth/register
Body: { email, password, name }
    ↓
AuthController.register()
    ↓
AuthService.register()
    ├─→ Check if email exists (UserRepository)
    ├─→ Hash password (BCryptPasswordEncoder)
    ├─→ Create User entity
    ├─→ Save to PostgreSQL (UserRepository.save())
    └─→ Generate JWT token (JwtUtils)
    ↓
Response: { token, userId, email, name }
    ↓
Mobile App stores token in AsyncStorage
```

## Login Flow

```
Mobile App (auth.tsx)
    ↓
POST /api/auth/login
Body: { email, password }
    ↓
AuthController.login()
    ↓
AuthService.login()
    ├─→ Authenticate (AuthenticationManager)
    │   └─→ UserDetailsServiceImpl loads user from PostgreSQL
    │   └─→ BCrypt verifies password
    ├─→ Generate JWT token (JwtUtils)
    └─→ Get user details (UserRepository)
    ↓
Response: { token, userId, email, name }
    ↓
Mobile App stores token in AsyncStorage
```

## Database Save Process

### 1. User Entity Created
```java
User user = new User();
user.setEmail("user@example.com");
user.setPassword(passwordEncoder.encode("password123")); // BCrypt hash
user.setName("John Doe");
user.setSafetyScore(50);
user.setCompletedMeetups(0);
user.setIsVerified(false);
user.setCreatedAt(LocalDateTime.now());
```

### 2. Saved to PostgreSQL
```java
User savedUser = userRepository.save(user);
// Hibernate automatically:
// - Generates INSERT SQL
// - Executes: INSERT INTO users (email, password, name, ...) VALUES (...)
// - Returns user with generated ID
```

### 3. JWT Token Generated
```java
String token = jwtUtils.generateTokenFromUsername(savedUser.getEmail());
// Creates JWT with:
// - Subject: email
// - Issued at: now
// - Expiration: now + 24 hours
// - Signed with: HS512 algorithm
```

## PostgreSQL Table Structure

The `users` table is automatically created by Hibernate:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,              -- Auto-increment
    email VARCHAR(255) UNIQUE NOT NULL,    -- Unique email
    password VARCHAR(255) NOT NULL,        -- BCrypt hashed password
    name VARCHAR(100) NOT NULL,            -- User name
    age INTEGER,                          -- Optional
    bio TEXT,                             -- Optional
    interests TEXT[],                     -- Array of interests
    safety_score INTEGER DEFAULT 50,      -- Default safety score
    completed_meetups INTEGER DEFAULT 0, -- Default meetups
    is_verified BOOLEAN DEFAULT false,    -- Verification status
    created_at TIMESTAMP NOT NULL         -- Auto-set timestamp
);
```

## Key Files

| File | Purpose |
|------|---------|
| `User.java` | Entity class - maps to PostgreSQL `users` table |
| `UserRepository.java` | JPA Repository - database operations |
| `AuthService.java` | Business logic - register/login with password hashing |
| `JwtUtils.java` | JWT token generation and validation |
| `AuthController.java` | REST endpoints - `/api/auth/register` and `/api/auth/login` |
| `SecurityConfig.java` | Spring Security configuration |
| `application.properties` | Database connection and JWT settings |

## What Happens When You Call Register

1. **Validation**: Email format, password length, name required
2. **Check Duplicate**: `userRepository.existsByEmail(email)`
3. **Hash Password**: `passwordEncoder.encode(password)` → BCrypt hash
4. **Create User Object**: Set all fields
5. **Save to DB**: `userRepository.save(user)` → INSERT into PostgreSQL
6. **Generate JWT**: `jwtUtils.generateTokenFromUsername(email)`
7. **Return Response**: Token + user info

## What Happens When You Call Login

1. **Validation**: Email format, password required
2. **Authenticate**: `authenticationManager.authenticate()`
   - Loads user from PostgreSQL
   - Compares password with BCrypt hash
3. **Generate JWT**: `jwtUtils.generateJwtToken(authentication)`
4. **Get User**: `userRepository.findByEmail(email)`
5. **Return Response**: Token + user info

## Security Features

✅ **Password Hashing**: BCrypt with salt (one-way encryption)
✅ **JWT Tokens**: Signed with HS512, expires in 24 hours
✅ **SQL Injection Protection**: JPA/Hibernate parameterized queries
✅ **CORS Enabled**: Cross-origin requests allowed
✅ **Input Validation**: Email format, password length, required fields

## Next Steps for Mobile App

Update your `AuthContext.tsx` to call the backend:

```typescript
const register = async (email: string, password: string, name: string) => {
  const response = await fetch('http://localhost:8080/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await response.json();
  await AsyncStorage.setItem('token', data.token);
  return true;
};

const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  await AsyncStorage.setItem('token', data.token);
  return true;
};
```

## Testing

1. **Start PostgreSQL**: Make sure database is running
2. **Start Backend**: `mvn spring-boot:run` or run in IDE
3. **Test Register**: 
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123","name":"Test"}'
   ```
4. **Test Login**:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"password123"}'
   ```

Your backend is **ready to use**! 🚀

