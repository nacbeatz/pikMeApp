package com.oddo.hackaton.backend.repository;

import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickRequestRepository extends JpaRepository<PickRequest, Long>
{
    List<PickRequest> findByUserId(Long userId);

    List<PickRequest> findByUserIdAndStatus(Long userId, PickStatus status);

    @Query(value = """
        SELECT pr.* FROM pick_requests pr
        WHERE pr.status = 'ACTIVE'
        AND ST_DWithin(
            pr.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
            :radiusMeters
        )
        ORDER BY ST_Distance(
            pr.location::geography,
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
        )
        """, nativeQuery = true)
    List<PickRequest> findNearbyPickRequests(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters
    );
}
