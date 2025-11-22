package com.oddo.hackaton.backend;

import com.oddo.hackaton.backend.model.entity.Match;
import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.model.enums.ActivityType;
import com.oddo.hackaton.backend.model.enums.MatchStatus;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import com.oddo.hackaton.backend.repository.MatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for MatchRepository using real PostgreSQL database.
 *
 * @DataJpaTest - Configures JPA components for testing
 * @AutoConfigureTestDatabase(replace = NONE) - Uses real PostgreSQL instead of H2
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class MatchRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private MatchRepository matchRepository;

    private User requesterUser;
    private User pickerUser;
    private PickRequest pickRequest;

    @BeforeEach
    void setUp() {
        // Create requester user
        requesterUser = new User();
        requesterUser.setEmail("requester@test.com");
        requesterUser.setPassword("password123");
        requesterUser.setName("Requester User");
        entityManager.persist(requesterUser);

        // Create picker user
        pickerUser = new User();
        pickerUser.setEmail("picker@test.com");
        pickerUser.setPassword("password123");
        pickerUser.setName("Picker User");
        entityManager.persist(pickerUser);

        // Create pick request
        pickRequest = new PickRequest();
        pickRequest.setUser(requesterUser);
        pickRequest.setActivityType(ActivityType.COFFEE); // ✅ ADD THIS LINE
        pickRequest.setSubject("Coffee meetup");
        pickRequest.setStatus(PickStatus.ACTIVE);
        entityManager.persist(pickRequest);

        entityManager.flush();
    }

    @Test
    void testFindByUserId_ShouldReturnMatchesForRequester() {
        // Given
        Match match = new Match();
        match.setPickRequest(pickRequest);
        match.setRequesterUser(requesterUser);
        match.setPickerUser(pickerUser);
        match.setStatus(MatchStatus.PENDING);
        entityManager.persist(match);
        entityManager.flush();

        // When
        List<Match> matches = matchRepository.findByUserId(requesterUser.getId());

        // Then
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getRequesterUser().getId()).isEqualTo(requesterUser.getId());
    }

    @Test
    void testFindByUserId_ShouldReturnMatchesForPicker() {
        // Given
        Match match = new Match();
        match.setPickRequest(pickRequest);
        match.setRequesterUser(requesterUser);
        match.setPickerUser(pickerUser);
        match.setStatus(MatchStatus.PENDING);
        entityManager.persist(match);
        entityManager.flush();

        // When
        List<Match> matches = matchRepository.findByUserId(pickerUser.getId());

        // Then
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getPickerUser().getId()).isEqualTo(pickerUser.getId());
    }

    @Test
    void testFindByUserIdAndStatus_ShouldFilterByStatus() {
        // Given
        Match pendingMatch = new Match();
        pendingMatch.setPickRequest(pickRequest);
        pendingMatch.setRequesterUser(requesterUser);
        pendingMatch.setPickerUser(pickerUser);
        pendingMatch.setStatus(MatchStatus.PENDING);
        entityManager.persist(pendingMatch);

        Match acceptedMatch = new Match();
        // Create another pick request for the second match
        PickRequest anotherPickRequest = new PickRequest();
        anotherPickRequest.setUser(requesterUser);
        anotherPickRequest.setActivityType(ActivityType.FOOD); // ✅ ADD THIS LINE
        anotherPickRequest.setSubject("Lunch meetup");
        anotherPickRequest.setStatus(PickStatus.ACTIVE);
        entityManager.persist(anotherPickRequest);

        acceptedMatch.setPickRequest(anotherPickRequest);
        acceptedMatch.setRequesterUser(requesterUser);
        acceptedMatch.setPickerUser(pickerUser);
        acceptedMatch.setStatus(MatchStatus.ACCEPTED);
        entityManager.persist(acceptedMatch);
        entityManager.flush();

        // When
        List<Match> pendingMatches = matchRepository.findByUserIdAndStatus(
                requesterUser.getId(),
                MatchStatus.PENDING
        );

        // Then
        assertThat(pendingMatches).hasSize(1);
        assertThat(pendingMatches.get(0).getStatus()).isEqualTo(MatchStatus.PENDING);
    }

    @Test
    void testFindByPickRequestIdAndStatus() {
        // Given
        Match match = new Match();
        match.setPickRequest(pickRequest);
        match.setRequesterUser(requesterUser);
        match.setPickerUser(pickerUser);
        match.setStatus(MatchStatus.PENDING);
        entityManager.persist(match);
        entityManager.flush();

        // When
        List<Match> matches = matchRepository.findByPickRequestIdAndStatus(
                pickRequest.getId(),
                MatchStatus.PENDING
        );

        // Then
        assertThat(matches).hasSize(1);
        assertThat(matches.get(0).getPickRequest().getId()).isEqualTo(pickRequest.getId());
    }

    @Test
    void testFindByPickRequestIdAndPickerUserId_ShouldReturnMatch() {
        // Given
        Match match = new Match();
        match.setPickRequest(pickRequest);
        match.setRequesterUser(requesterUser);
        match.setPickerUser(pickerUser);
        match.setStatus(MatchStatus.PENDING);
        entityManager.persist(match);
        entityManager.flush();

        // When
        Optional<Match> foundMatch = matchRepository.findByPickRequestIdAndPickerUserId(
                pickRequest.getId(),
                pickerUser.getId()
        );

        // Then
        assertThat(foundMatch).isPresent();
        assertThat(foundMatch.get().getPickerUser().getId()).isEqualTo(pickerUser.getId());
    }

    @Test
    void testFindByPickRequestIdAndPickerUserId_ShouldReturnEmpty() {
        // When
        Optional<Match> foundMatch = matchRepository.findByPickRequestIdAndPickerUserId(
                999L, // Non-existent pick request
                pickerUser.getId()
        );

        // Then
        assertThat(foundMatch).isEmpty();
    }
}