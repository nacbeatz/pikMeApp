package com.oddo.hackaton.backend.model.entity;

import com.oddo.hackaton.backend.model.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"pick_request_id", "picker_user_id"})
        },
        indexes = {
                @Index(name = "idx_match_picker", columnList = "picker_user_id"),
                @Index(name = "idx_match_requester", columnList = "requester_user_id"),
                @Index(name = "idx_match_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pick_request_id", nullable = false)
    private PickRequest pickRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "picker_user_id", nullable = false)
    private User pickerUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_user_id", nullable = false)
    private User requesterUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // Helper method
    public boolean isAccepted()
    {
        return status == MatchStatus.ACCEPTED;
    }

    // Helper method to check if user is part of match
    public boolean involveUser(Long userId)
    {
        return pickerUser.getId().equals(userId) || requesterUser.getId().equals(userId);
    }
}
