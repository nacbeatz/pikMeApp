package com.oddo.hackaton.backend.controller;

import com.oddo.hackaton.backend.model.dto.reponse.AuthResponse;
import com.oddo.hackaton.backend.model.dto.request.LoginRequest;
import com.oddo.hackaton.backend.model.dto.request.RegisterRequest;
import com.oddo.hackaton.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController
{
    private final AuthService authService;

    /**
     * Register a new user.
     *
     * POST /api/auth/register
     * Body: { "email": "user@example.com", "password": "password123", "name": "John Doe" }
     * Response: { "token": "jwt_token", "userId": 1, "email": "...", "name": "..." }
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request)
    {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login existing user.
     *
     * POST /api/auth/login
     * Body: { "email": "user@example.com", "password": "password123" }
     * Response: { "token": "jwt_token", "userId": 1, "email": "...", "name": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request)
    {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
