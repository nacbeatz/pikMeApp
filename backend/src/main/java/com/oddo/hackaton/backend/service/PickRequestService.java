package com.oddo.hackaton.backend.service;

import com.oddo.hackaton.backend.exceptions.PickRequestException;
import com.oddo.hackaton.backend.exceptions.UserException;
import com.oddo.hackaton.backend.model.dto.reponse.NearbyPickRequestResponse;
import com.oddo.hackaton.backend.model.dto.reponse.PickRequestResponse;
import com.oddo.hackaton.backend.model.dto.request.CreatePickRequestRequest;
import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import com.oddo.hackaton.backend.repository.PickRequestRepository;
import com.oddo.hackaton.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PickRequestService {

    private final PickRequestRepository pickRequestRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Create a new pick request.
     * User becomes the requester (wants to be picked up)
     */

    @Transactional
    public PickRequestResponse createPickRequest(CreatePickRequestRequest request, String userEmail)
    {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserException("User not found"));

        // Create PostGIS Point
        Point location = geometryFactory.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));

        // Calculate expiration (2 hours from now)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(2);

        PickRequest pickRequest = PickRequest.builder()
                .user(user)
                .activityType(request.getActivityType())
                .subject(request.getSubject())
                .durationMinutes(request.getDurationMinutes())
                .location(location)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(PickStatus.ACTIVE) // Always active when created
                .expiresAt(expiresAt)
                .build();

        PickRequest saved = pickRequestRepository.save(pickRequest);
        return mapToResponse(saved);
    }

    /**
     * Get current user's own pick requests.
     */
    @Transactional(readOnly = true)
    public List<PickRequestResponse> getMyPickRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<PickRequest> myRequests = pickRequestRepository.findByUserId(user.getId());
        return myRequests.stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Cancel a pick request (only if ACTIVE).
     */
    @Transactional
    public void cancelPickRequest(Long pickRequestId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new PickRequestException("User not found"));

        PickRequest pickRequest = pickRequestRepository.findById(pickRequestId)
                .orElseThrow(() -> new PickRequestException("Pick request not found"));

        // Validate ownership
        if (!pickRequest.getUser().getId().equals(user.getId())) {
            throw new PickRequestException("You can only cancel your own pick requests");
        }

        // Can only cancel if ACTIVE
        if (pickRequest.getStatus() != PickStatus.ACTIVE) {
            throw new PickRequestException("Can only cancel ACTIVE pick requests");
        }

        pickRequest.setStatus(PickStatus.CANCELLED);
        pickRequestRepository.save(pickRequest);
    }


    /**
     * Find nearby active pick requests, excluding the current user's own requests.
     */
    @Transactional(readOnly = true)
    public List<NearbyPickRequestResponse> findNearbyPickRequests(
            Double latitude,
            Double longitude,
            Double radiusMeters,
            String currentUserEmail)
    {

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<PickRequest> nearbyRequests = pickRequestRepository.findNearbyPickRequests(
                latitude, longitude, radiusMeters
        );

        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        return nearbyRequests.stream()
                .filter(pr -> !pr.getUser().getId().equals(currentUser.getId())) // Exclude own requests
                .filter(pr -> pr.getStatus() == PickStatus.ACTIVE) // Only active
                .map(pr -> {
                    User requester = pr.getUser();

                    // Calculate distance (simple approximation using Haversine)
                    double distance = calculateDistance(
                            latitude, longitude,
                            pr.getLatitude(), pr.getLongitude()
                    );

                    return NearbyPickRequestResponse.builder()
                            .pickRequestId(pr.getId())
                            .userId(requester.getId())
                            .userName(requester.getName())
                            .userAge(requester.getAge())
                            .userBio(requester.getBio())
                            .interests(requester.getInterests())
                            .safetyScore(requester.getSafetyScore())
                            .activityType(pr.getActivityType())
                            .subject(pr.getSubject())
                            .durationMinutes(pr.getDurationMinutes())
                            .latitude(pr.getLatitude())
                            .longitude(pr.getLongitude())
                            .distanceMeters(distance)
                            .createdAt(pr.getCreatedAt().format(formatter))
                            .build();
                })
                .toList();
    }

    // === HELPER ===
    /**
     * Haversine formula for distance calculation.
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371000; // meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS * c;
    }

    private PickRequestResponse mapToResponse(PickRequest pickRequest)
    {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        return PickRequestResponse.builder()
                .pickRequestId(pickRequest.getId())
                .userId(pickRequest.getUser().getId())
                .userName(pickRequest.getUser().getName())
                .activityType(pickRequest.getActivityType())
                .subject(pickRequest.getSubject())
                .durationMinutes(pickRequest.getDurationMinutes())
                .latitude(pickRequest.getLatitude())
                .longitude(pickRequest.getLongitude())
                .status(pickRequest.getStatus())
                .createdAt(pickRequest.getCreatedAt().format(formatter))
                .expiresAt(pickRequest.getExpiresAt() != null ? pickRequest.getExpiresAt().format(formatter) : null)
                .build();
    }
}
