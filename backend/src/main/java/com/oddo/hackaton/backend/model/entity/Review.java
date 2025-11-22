package com.oddo.hackaton.backend.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"meetup_id", "reviewer_id"})
        },
        indexes = {
                @Index(name = "idx_review_meetup", columnList = "meetup_id"),
                @Index(name = "idx_review_reviewed_user", columnList = "reviewed_user_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id", nullable = false)
    private Meetup meetup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_user_id", nullable = false)
    private User reviewedUser;

    @Column(nullable = false)
    private Integer rating; // 1-5 stars

    // Badges like "Friendly", "Punctual", "Good listener"
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "badges", columnDefinition = "TEXT[]")
    private String[] badges;

    @Column(name = "would_meet_again")
    private Boolean wouldMeetAgain;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Helper method: Check if positive review
    public boolean isPositive()
    {
        return rating != null && rating >= 4;
    }
}
