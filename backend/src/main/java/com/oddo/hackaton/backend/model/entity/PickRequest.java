package com.oddo.hackaton.backend.model.entity;

import com.oddo.hackaton.backend.model.enums.ActivityType;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;


import java.time.LocalDateTime;

@Entity
@Table(name = "pick_requests", indexes = {
        @Index(name = "idx_pick_status", columnList = "status"),
        @Index(name = "idx_pick_user", columnList = "user_id"),
        @Index(name = "idx_pick_expires", columnList = "expires_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 50)
    private ActivityType activityType;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    // PostGIS Point for geospatial queries
    @Column(columnDefinition = "geography(Point,4326)")
    private Point location;

    // Separate lat/long for easier JSON serialization
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PickStatus status = PickStatus.ACTIVE;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Helper method to check if expired
    public boolean isExpired()
    {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
