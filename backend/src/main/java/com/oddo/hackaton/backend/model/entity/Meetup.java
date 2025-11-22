package com.oddo.hackaton.backend.model.entity;

import com.oddo.hackaton.backend.model.enums.MeetupStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "meetups", indexes = {
        @Index(name = "idx_meetup_match", columnList = "match_id"),
        @Index(name = "idx_meetup_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Meetup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false, unique = true)
    private Match match;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MeetupStatus status = MeetupStatus.NOT_STARTED;

    // Safety feature: Both users must confirm start
    @Column(name = "picker_confirmed_start")
    @Builder.Default
    private Boolean pickerConfirmedStart = false;

    @Column(name = "requester_confirmed_start")
    @Builder.Default
    private Boolean requesterConfirmedStart = false;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    // Safety feature: Both users must confirm end
    @Column(name = "picker_confirmed_end")
    @Builder.Default
    private Boolean pickerConfirmedEnd = false;

    @Column(name = "requester_confirmed_end")
    @Builder.Default
    private Boolean requesterConfirmedEnd = false;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Helper method: Check if both confirmed start
    public boolean isBothConfirmedStart()
    {
        return Boolean.TRUE.equals(pickerConfirmedStart) &&
                Boolean.TRUE.equals(requesterConfirmedStart);
    }

    // Helper method: Check if both confirmed end
    public boolean isBothConfirmedEnd()
    {
        return Boolean.TRUE.equals(pickerConfirmedEnd) &&
                Boolean.TRUE.equals(requesterConfirmedEnd);
    }

    // Helper method: Get duration in minutes
    public Long getDurationMinutes()
    {
        if (startedAt != null && endedAt != null)
        {
            return java.time.Duration.between(startedAt, endedAt).toMinutes();
        }
        return null;
    }
}