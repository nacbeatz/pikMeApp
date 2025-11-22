package com.oddo.hackaton.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    /**
     * Get current authenticated user's profile.
     *
     * GET /api/users/me
     * Headers: Authorization: Bearer {jwt_token}
     * Response: { "id": 1, "email": "...", "name": "..." }
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of(
                "email", userDetails.getUsername(),
                "message", "Authenticated successfully"
        ));
    }

    /**
     * Example protected endpoint.
     *
     * GET /api/users/profile
     * Headers: Authorization: Bearer {jwt_token}
     */
    @GetMapping("/profile")
    public ResponseEntity<String> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok("Hello " + userDetails.getUsername() + "! This is a protected endpoint.");
    }
}
