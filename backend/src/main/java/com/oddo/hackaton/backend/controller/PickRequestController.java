package com.oddo.hackaton.backend.controller;

import com.oddo.hackaton.backend.model.dto.reponse.NearbyPickRequestResponse;
import com.oddo.hackaton.backend.model.dto.reponse.PickRequestResponse;
import com.oddo.hackaton.backend.model.dto.request.CreatePickRequestRequest;
import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.service.PickRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pick-requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class PickRequestController
{
    private final PickRequestService pickRequestService;

    /**
     * Create a new pick request (User wants to be picked up).
     *
     * POST /api/pick-requests
     * Headers: Authorization: Bearer {jwt_token}
     * Body: {
     *   "activityType": "COFFEE",
     *   "subject": "Need a coffee buddy at Cafe Olimpico",
     *   "durationMinutes": 60,
     *   "latitude": 45.5088,
     *   "longitude": -73.5878
     * }
     *
     * Response: {
     *   "pickRequestId": 1,
     *   "userId": 1,
     *   "userName": "Alice",
     *   "activityType": "COFFEE",
     *   "subject": "Need a coffee buddy",
     *   "durationMinutes": 60,
     *   "latitude": 45.5088,
     *   "longitude": -73.5878,
     *   "status": "ACTIVE",
     *   "createdAt": "2024-01-15T10:30:00",
     *   "expiresAt": "2024-01-15T12:30:00"
     * }
     */
    @PostMapping
    public ResponseEntity<PickRequestResponse> createPickRequest(
            @Valid @RequestBody CreatePickRequestRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        PickRequestResponse response = pickRequestService.createPickRequest(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Get nearby active pick requests for the map view.
     *
     * GET /api/pick-requests/nearby?latitude=45.5&longitude=-73.6&radius=5000
     *
     * @param latitude Current user latitude
     * @param longitude Current user longitude
     * @param radius Search radius in meters (default 5000m = 5km)
     * @return List of nearby pick requests with user info
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyPickRequestResponse>> getNearbyPickRequests(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "50000") Double radius,
            @AuthenticationPrincipal UserDetails userDetails) {

        List<NearbyPickRequestResponse> nearbyRequests =
                pickRequestService.findNearbyPickRequests(latitude, longitude, radius, userDetails.getUsername());

        return ResponseEntity.ok(nearbyRequests);
    }

    /**
     * Get current user's pick requests (requester's own requests).
     *
     * GET /api/pick-requests/my
     * Headers: Authorization: Bearer {jwt_token}
     */
    @GetMapping("/my")
    public ResponseEntity<List<PickRequestResponse>> getMyPickRequests(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<PickRequestResponse> myRequests = pickRequestService.getMyPickRequests(userDetails.getUsername());
        return ResponseEntity.ok(myRequests);
    }

    /**
     * Cancel a pick request (only if still ACTIVE).
     *
     * DELETE /api/pick-requests/{id}
     * Headers: Authorization: Bearer {jwt_token}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelPickRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        pickRequestService.cancelPickRequest(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
