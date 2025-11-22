package com.oddo.hackaton.backend.repository;

import com.oddo.hackaton.backend.model.entity.Meetup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MeetupRepository extends JpaRepository<Meetup, Long>
{
    Optional<Meetup> findByMatchId(Long matchId);
}
