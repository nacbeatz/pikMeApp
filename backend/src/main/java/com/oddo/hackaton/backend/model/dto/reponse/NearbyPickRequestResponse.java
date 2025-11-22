package com.oddo.hackaton.backend.model.dto.reponse;

import com.oddo.hackaton.backend.model.enums.ActivityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearbyPickRequestResponse {
    private Long pickRequestId;
    private Long userId;
    private String userName;
    private Integer userAge;
    private String userBio;
    private String[] interests;
    private Integer safetyScore;
    private ActivityType activityType;
    private String subject;
    private Integer durationMinutes;
    private Double latitude;
    private Double longitude;
    private Double distanceMeters; // Distance from picker
    private String createdAt;
}
