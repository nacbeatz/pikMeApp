package com.oddo.hackaton.backend.model.dto.reponse;

import com.oddo.hackaton.backend.model.enums.ActivityType;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickRequestResponse {
    private Long pickRequestId;
    private Long userId;
    private String userName;
    private ActivityType activityType;
    private String subject;
    private Integer durationMinutes;
    private Double latitude;
    private Double longitude;
    private PickStatus status;
    private String createdAt; // WHEN it was created
    private String expiresAt; // WHEN it expires (2 hours from creation)
}
