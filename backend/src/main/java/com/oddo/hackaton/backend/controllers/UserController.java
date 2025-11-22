package com.oddo.hackaton.backend.controllers;

import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {
    @Autowired private UserService service;

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
    @GetMapping("")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(service.getAllUsers());
    }

    @GetMapping("{id}")
    public ResponseEntity<User> getUser(@RequestBody Long id) {
        User user = service.getUser(id);
        return user == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(user);
    }
}
