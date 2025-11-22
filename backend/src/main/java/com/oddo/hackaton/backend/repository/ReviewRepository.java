package com.oddo.hackaton.backend.repository;

import com.oddo.hackaton.backend.model.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>
{
    List<Review> findByReviewedUserId(Long reviewedUserId);

    Optional<Review> findByMeetupIdAndReviewerId(Long meetupId, Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewedUser.id = :userId")
    Double calculateAverageRating(@Param("userId") Long userId);
}
