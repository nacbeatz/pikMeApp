package com.oddo.hackaton.backend.repository;

import com.oddo.hackaton.backend.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long>
{
    List<Message> findByMatchIdOrderByCreatedAtAsc(Long matchId);

    long countByMatchIdAndIsReadFalse(Long matchId);
}
