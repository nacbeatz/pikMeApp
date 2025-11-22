package com.oddo.hackaton.backend.repository;

import com.oddo.hackaton.backend.model.entity.Match;
import com.oddo.hackaton.backend.model.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long>
{
    @Query("SELECT m FROM Match m WHERE m.pickerUser.id = :userId OR m.requesterUser.id = :userId")
    List<Match> findByUserId(@Param("userId") Long userId);

    @Query("SELECT m FROM Match m WHERE (m.pickerUser.id = :userId OR m.requesterUser.id = :userId) AND m.status = :status")
    List<Match> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") MatchStatus status);

    List<Match> findByPickRequestIdAndStatus(Long pickRequestId, MatchStatus status);

    Optional<Match> findByPickRequestIdAndPickerUserId(Long pickRequestId, Long pickerUserId);
}
