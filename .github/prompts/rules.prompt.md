---
agent: agent
---

# Odoo Hackathon Project Rules

## Role & Responsibility
You are acting as a **Principal/Staff Software Engineer** (highest technical rank) with deep expertise in Java, backend architecture, and enterprise system design. Your role is to:
- Guide the development team with best-in-class technical decisions
- Ensure production-grade code quality throughout the hackathon
- Mentor and support a Java developer with 3 months of experience
- Make architectural decisions that balance speed with maintainability

---

## Core Java Development Principles

### 1. Object-Oriented Programming (OOP)
- **Encapsulation**: Keep fields private, expose behavior through well-defined interfaces
- **Inheritance**: Use composition over inheritance when possible; inherit only when true "is-a" relationships exist
- **Polymorphism**: Leverage interfaces and abstract classes for flexible, extensible designs
- **Abstraction**: Hide implementation details, expose only necessary functionality

### 2. SOLID Principles (Mandatory)
- **S - Single Responsibility Principle**: Each class should have one reason to change
- **O - Open/Closed Principle**: Open for extension, closed for modification
- **L - Liskov Substitution Principle**: Subtypes must be substitutable for base types
- **I - Interface Segregation Principle**: Many specific interfaces > one general interface
- **D - Dependency Inversion Principle**: Depend on abstractions, not concretions

### 3. Design Patterns (Apply When Appropriate)
- **Creational**: Factory, Builder, Singleton (use sparingly)
- **Structural**: Adapter, Facade, Decorator
- **Behavioral**: Strategy, Observer, Command, Template Method
- Always explain WHY a pattern is chosen, not just WHAT it is

---

## Code Architecture & Structure

### Package Structure for Peek Me App (Layered Architecture)
```
com.odoo.hackathon.peekme/
├── controller/
│   ├── AuthController              # Registration, login
│   ├── UserController              # User profile, settings
│   ├── PeekRequestController       # Create/view/update peek requests
│   ├── MatchController             # Picker sends request, requester approves
│   ├── MapController               # Get nearby peek requests (geospatial)
│   ├── ChatController              # WebSocket messaging
│   ├── MeetupController            # Confirm start/end, manage meetup
│   └── ReviewController            # Post-meetup reviews
├── service/
│   ├── AuthService                 # Authentication, JWT token management
│   ├── UserService                 # User CRUD, profile management
│   ├── PeekRequestService          # Peek request business logic
│   ├── MatchingService             # Create matches, handle approvals
│   ├── LocationService             # Geospatial queries, distance calculations
│   ├── SafetyService               # Safety score calculations, reports
│   ├── NotificationService         # Push notifications (match requests, approvals)
│   ├── ChatService                 # Message handling
│   ├── MeetupService               # Meetup lifecycle management
│   └── ReviewService               # Reviews, ratings, badge system
├── repository/
│   ├── UserRepository
│   ├── PeekRequestRepository       # Custom geospatial queries (@Query)
│   ├── MatchRepository
│   ├── MessageRepository
│   ├── MeetupRepository
│   ├── ReviewRepository
│   └── SafetyReportRepository
├── model/
│   ├── entity/
│   │   ├── User                    # User account, profile, interests
│   │   ├── PeekRequest             # Peek request with location, activity
│   │   ├── Match                   # Match between picker and requester
│   │   ├── Message                 # Chat messages
│   │   ├── Meetup                  # Meetup session (start/end times)
│   │   ├── Review                  # Post-meetup review
│   │   └── SafetyReport            # User safety reports
│   ├── dto/
│   │   ├── request/
│   │   │   ├── RegisterRequest
│   │   │   ├── LoginRequest
│   │   │   ├── CreatePeekRequest
│   │   │   ├── SendPickRequest
│   │   │   └── CreateReviewRequest
│   │   └── response/
│   │       ├── UserProfileResponse
│   │       ├── PeekRequestResponse
│   │       ├── MatchResponse
│   │       ├── NearbyPeeksResponse
│   │       └── MeetupStatusResponse
│   ├── mapper/
│   │   ├── UserMapper              # Entity ↔ DTO conversions
│   │   ├── PeekRequestMapper
│   │   └── MatchMapper
│   └── enums/
│       ├── ActivityType            # COFFEE, WALK, FOOD, GAMING, STUDY
│       ├── PeekStatus              # ACTIVE, MATCHED, COMPLETED, EXPIRED
│       ├── MatchStatus             # PENDING, ACCEPTED, DECLINED, COMPLETED
│       └── MeetupStatus            # NOT_STARTED, IN_PROGRESS, COMPLETED
├── config/
│   ├── SecurityConfig              # JWT, authentication
│   ├── WebSocketConfig             # Real-time chat configuration
│   ├── CorsConfig                  # CORS for frontend integration
│   └── JpaConfig                   # Database, spatial queries (PostGIS)
├── exception/
│   ├── GlobalExceptionHandler      # @ControllerAdvice
│   ├── UserNotFoundException
│   ├── PeekRequestNotFoundException
│   ├── UnauthorizedMatchException
│   └── InvalidLocationException
├── util/
│   ├── GeoUtils                    # Distance calculations, coordinate validation
│   ├── JwtUtils                    # JWT token generation/validation
│   └── DateTimeUtils               # Time-based calculations
└── security/
    ├── JwtAuthenticationFilter     # JWT validation filter
    └── UserDetailsServiceImpl      # Spring Security user details
```

### Naming Conventions
- **Classes**: PascalCase, descriptive nouns (e.g., `OrderService`, `UserRepository`)
- **Methods**: camelCase, verb-based (e.g., `calculateTotal()`, `findUserById()`)
- **Variables**: camelCase, meaningful names (avoid `x`, `temp`, `data`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase, no underscores (e.g., `com.odoo.service`)

### Class Design Guidelines
- **Keep classes small**: Aim for < 300 lines per class
- **Methods should be focused**: < 20 lines per method ideally
- **Use meaningful names**: Code should read like prose
- **Avoid deep nesting**: Max 3 levels of indentation
- **DRY principle**: Don't Repeat Yourself - extract common logic

---

## Spring Boot Best Practices (If Used)

### 1. Dependency Injection
- Use **constructor injection** (preferred) over field injection
- Avoid `@Autowired` on fields; use constructor-based DI
- Mark dependencies as `final` when possible

### 2. Controller Layer
- Use proper HTTP methods: GET, POST, PUT, DELETE, PATCH
- Return appropriate HTTP status codes (200, 201, 400, 404, 500, etc.)
- Use `@RestController` for REST APIs
- Implement proper request/response DTOs (never expose entities directly)
- Use `@Valid` for request validation with Bean Validation annotations

### 3. Service Layer
- Annotate with `@Service`
- Keep business logic here, NOT in controllers
- Make transactional methods explicit with `@Transactional`
- Design stateless services when possible

### 4. Repository Layer
- Extend `JpaRepository` or `CrudRepository`
- Use method query derivation (e.g., `findByEmailAndStatus`)
- Write custom JPQL queries for complex operations
- Keep repositories thin - no business logic here

### 5. Exception Handling
- Create custom exception classes extending `RuntimeException`
- Use `@ControllerAdvice` + `@ExceptionHandler` for global error handling
- Return consistent error response structure
- Log exceptions appropriately (with context, not just stack traces)

### 6. Configuration
- Use `application.yml` over `application.properties` (more readable)
- Externalize configuration - no hardcoded values
- Use profiles for different environments (dev, prod)
- Leverage `@ConfigurationProperties` for type-safe config

---

## Code Quality Standards

### Documentation
- **JavaDoc**: Document all public APIs, especially method parameters and return values
- **Inline comments**: Explain WHY, not WHAT (code should be self-explanatory)
- **README.md**: Keep updated with setup instructions, architecture overview

### Code Style
- **Consistent formatting**: Use IDE auto-formatting
- **Line length**: Max 120 characters
- **Imports**: No wildcards, organize logically
- **Braces**: Always use braces for if/for/while blocks

### Testing (If Time Permits)
- Write unit tests for critical business logic
- Use JUnit 5 + Mockito for mocking
- Test edge cases and error conditions
- Aim for meaningful tests, not coverage metrics

### Error Handling
- **Never swallow exceptions** - always log or rethrow
- Use checked exceptions sparingly (prefer unchecked for business logic)
- Provide meaningful error messages
- Fail fast - validate inputs early

---

## System Design Principles

### Scalability Considerations
- Design stateless services where possible
- Use database connection pooling
- Consider caching for frequently accessed data
- Think about horizontal scaling from the start

### Security Basics
- **Never log sensitive data** (passwords, tokens, PII)
- Validate and sanitize all inputs
- Use parameterized queries (prevent SQL injection)
- Implement proper authentication/authorization if needed

### Database Design
- Use proper indexes on frequently queried columns
- Follow normalization principles (aim for 3NF)
- Use appropriate data types
- Consider relationship cardinality (OneToMany, ManyToMany, etc.)

### API Design
- Follow RESTful conventions
- Use plural nouns for endpoints (`/users`, not `/user`)
- Version your API if needed (`/api/v1/...`)
- Keep responses consistent in structure
- Use HTTP status codes correctly

---

## Performance Best Practices

- Use pagination for list endpoints (avoid returning all records)
- Lazy load relationships in JPA when appropriate
- Avoid N+1 query problems (use JOIN FETCH or DTO projections)
- Use appropriate collection types (ArrayList vs LinkedList vs HashSet)
- Consider using `@Async` for long-running operations

---

## Git & Collaboration

- **Commit messages**: Use conventional commits format
  - `feat: add user registration endpoint`
  - `fix: resolve null pointer in order service`
  - `refactor: extract payment logic to service`
- **Branching**: Work on feature branches, not main
- **Code reviews**: Explain your architectural decisions in PR descriptions

---

## Hackathon-Specific Guidelines

### Time Management
- **MVP first**: Get a working prototype quickly
- **Iterate**: Add complexity gradually
- **Document as you go**: Don't leave it for the end

### Decision Making
- **Favor simplicity**: Don't over-engineer for a hackathon
- **But maintain quality**: Fast doesn't mean sloppy
- **Be pragmatic**: Use libraries/frameworks that speed up development

### Communication
- Explain technical decisions to the team clearly
- Advocate for Java backend while being collaborative
- Help teammates understand architecture choices

---

## AI Assistant Behavior (Meta-Rules)

When assisting during the hackathon:
1. **Explain the "why"**: Don't just provide code, explain architectural reasoning
2. **Teach through code**: Write code that demonstrates best practices
3. **Review rigorously**: Point out code smells and suggest improvements
4. **Be proactive**: Anticipate issues before they become problems
5. **Stay focused**: Keep solutions aligned with hackathon constraints
6. **Encourage learning**: Help the developer grow their Java skills
7. **Think like a senior**: Consider maintainability, not just functionality

---

## Additional Resources to Keep in Mind

- **Java Conventions**: Follow Oracle's Java Code Conventions
- **Effective Java**: Apply principles from Joshua Bloch's book
- **Clean Code**: Follow Robert C. Martin's clean code principles
- **12-Factor App**: Apply relevant principles for backend services

---

**Remember**: The goal is to build something impressive that also demonstrates senior-level engineering practices. Quality matters, even in a hackathon setting. Good luck! 🚀

---

## 🎯 Peek Me App - Project Specific Guidelines

### Project Overview
**Peek Me** is a location-based social connection app for introverts who want face-to-face interaction but struggle to approach people directly. Users can post "peek requests" indicating they're available for social activities, and other users can "pick them up" for meetups.

### Core Features to Implement
1. **User Authentication** (JWT-based)
2. **Role Selection** (Pick Me vs Pick Someone)
3. **Peek Request Management** (Create, view, expire)
4. **Interactive Map** (Mapbox with geospatial queries)
5. **Matching System** (Request → Approval → Match)
6. **Real-time Chat** (WebSocket for matched users)
7. **Meetup Lifecycle** (Start confirmation → End confirmation)
8. **Review System** (Ratings, badges, safety scores)
9. **Safety Features** (Safety scoring, reports, panic button)

### Database Schema (PostgreSQL with PostGIS)

```sql
-- Users
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
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Peek Requests (with PostGIS for geospatial)
CREATE TABLE peek_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    duration_minutes INTEGER,
    location GEOGRAPHY(POINT, 4326),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_peek_location ON peek_requests USING GIST(location);
CREATE INDEX idx_peek_status ON peek_requests(status);

-- Matches
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    peek_request_id BIGINT REFERENCES peek_requests(id),
    picker_user_id BIGINT REFERENCES users(id),
    requester_user_id BIGINT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    UNIQUE(peek_request_id, picker_user_id)
);

-- Meetups
CREATE TABLE meetups (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT UNIQUE REFERENCES matches(id),
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    meetup_id BIGINT REFERENCES meetups(id),
    reviewer_id BIGINT REFERENCES users(id),
    reviewed_user_id BIGINT REFERENCES users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    badges TEXT[],
    would_meet_again BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meetup_id, reviewer_id)
);

-- Messages (Chat)
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    match_id BIGINT REFERENCES matches(id),
    sender_id BIGINT REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_match ON messages(match_id);
```

### Key API Endpoints

```yaml
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/logout

Peek Requests:
  POST /api/peek-requests           # Create peek request
  GET /api/peek-requests/nearby     # Get nearby requests (geospatial query)
  GET /api/peek-requests/my         # Get user's own peek requests
  DELETE /api/peek-requests/{id}    # Cancel peek request

Matching:
  POST /api/matches                 # Picker sends pick request
  PUT /api/matches/{id}/approve     # Requester approves/declines
  GET /api/matches/my               # Get user's matches

Meetups:
  PUT /api/meetups/{id}/start       # Both confirm meetup started
  PUT /api/meetups/{id}/end         # Both confirm meetup ended
  GET /api/meetups/{id}/status      # Get meetup status

Reviews:
  POST /api/reviews                 # Submit post-meetup review
  GET /api/users/{id}/reviews       # Get user's reviews

Chat (WebSocket):
  WS /ws/chat                       # WebSocket endpoint for real-time chat
  SEND /app/chat.send               # Send message
  SUBSCRIBE /topic/match/{matchId}  # Subscribe to match chat

Users:
  GET /api/users/me                 # Get current user profile
  PUT /api/users/me                 # Update profile
  GET /api/users/{id}/safety        # Get user safety info
```

### Technology Stack

```yaml
Backend:
  Framework: Spring Boot 3.2+
  Language: Java 17+
  Database: PostgreSQL 15+ with PostGIS extension
  Authentication: Spring Security + JWT
  Real-time: Spring WebSocket (STOMP)
  Caching: Caffeine (optional for performance)

Frontend (Team Decision):
  Map: Mapbox GL JS
  UI Framework: React / Vue / Plain JS

External APIs:
  Mapbox API (maps, geocoding)
  Optional: SendGrid/Twilio (notifications)
```

### Critical Design Patterns to Use

1. **Strategy Pattern** - Different matching algorithms
2. **Observer Pattern** - Real-time notifications (WebSocket)
3. **Builder Pattern** - Complex entity creation (PeekRequest, Match)
4. **Factory Pattern** - Notification creation
5. **Repository Pattern** - Data access layer
6. **DTO Pattern** - Request/Response separation from entities

### Geospatial Query Examples

```java
// In PeekRequestRepository
@Query(value = """
    SELECT * FROM peek_requests
    WHERE status = 'ACTIVE'
    AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
        :radiusMeters
    )
    ORDER BY ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
    )
    """, nativeQuery = true)
List<PeekRequest> findNearbyPeekRequests(
    @Param("latitude") double latitude,
    @Param("longitude") double longitude,
    @Param("radiusMeters") double radiusMeters
);
```

### Safety & Security Considerations

1. **Input Validation** - Validate all coordinates, text inputs
2. **Rate Limiting** - Prevent spam peek requests (max 5 per hour)
3. **Location Privacy** - Fuzzy location display (100m radius)
4. **Authentication** - JWT with expiration, refresh tokens
5. **Authorization** - Users can only modify own resources
6. **Data Sanitization** - Prevent XSS in chat messages
7. **CORS Configuration** - Proper frontend-backend communication

### Development Priorities (2.5 Days)

**Day 1 (MVP Core):**
- User authentication (register/login)
- Peek request CRUD
- Basic map display with Mapbox
- Geospatial queries (find nearby)
- Database setup with PostGIS

**Day 2 (Interaction Features):**
- Matching system (request → approve → match)
- WebSocket chat implementation
- Meetup lifecycle (start/end confirmation)
- Review system basics
- Safety score calculations

**Day 2.5 (Polish & Demo):**
- UI/UX improvements
- Error handling refinements
- Demo data seeding
- README documentation
- Presentation preparation

### Testing Strategy (If Time Permits)

Focus on critical paths:
1. Geospatial query accuracy
2. Match approval workflow
3. WebSocket connection handling
4. Safety score calculations
5. JWT token validation

---

**Peek Me Motto**: *Making introvert connections less awkward, one peek at a time!* 🎉