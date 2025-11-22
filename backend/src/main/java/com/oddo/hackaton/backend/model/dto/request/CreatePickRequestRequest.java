package com.oddo.hackaton.backend.model.dto.request;

import com.oddo.hackaton.backend.model.enums.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePickRequestRequest
{
    @NotNull(message = "Activity type is required (e.g., COFFEE, FOOD, WALK)")
    private ActivityType activityType; // WHAT - the activity

    @NotBlank(message = "Subject is required (describe what you want to do)")
    private String subject; // WHAT - more details

    @Positive(message = "Duration must be positive")
    private Integer durationMinutes; // DURATION

    @NotNull(message = "Latitude is required")
    private Double latitude; // LOCATION

    @NotNull(message = "Longitude is required")
    private Double longitude; // LOCATION

    // WHEN is implicit - createdAt timestamp + expiresAt (2 hours from now)
    // STATUS is always ACTIVE when creating a new pick request
}
