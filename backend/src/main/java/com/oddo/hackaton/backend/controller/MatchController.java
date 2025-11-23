package com.oddo.hackaton.backend.controller;

import com.oddo.hackaton.backend.model.dto.reponse.MatchResponse;
import com.oddo.hackaton.backend.model.dto.request.SendPickRequest;
import com.oddo.hackaton.backend.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class MatchController {

    private final MatchService matchService;

    /**
     * Picker sends a pick request to a pick request.
     *
     * POST /api/matches
     * Body: { "pickRequestId": 123 }
     *
     * Creates a Match with PENDING status. Requester must approve.
     */
    @PostMapping
    public ResponseEntity<MatchResponse> sendPickRequest(
            @Valid @RequestBody SendPickRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        MatchResponse match = matchService.createMatch(
                request.getPickRequestId(),
                userDetails.getUsername()
        );

        return ResponseEntity.ok(match);
    }

    /**
     * Requester approves or declines a match request.
     *
     * PUT /api/matches/{matchId}/respond
     * Body: { "approved": true }
     */
    @PutMapping("/{matchId}/respond")
    public ResponseEntity<MatchResponse> respondToMatch(
            @PathVariable Long matchId,
            @RequestParam Boolean approved,
            @AuthenticationPrincipal UserDetails userDetails) {

        MatchResponse match = matchService.respondToMatch(matchId, approved, userDetails.getUsername());
        return ResponseEntity.ok(match);
    }
}
