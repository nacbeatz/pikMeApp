package com.oddo.hackaton.backend.service;

import com.oddo.hackaton.backend.exceptions.PickRequestException;
import com.oddo.hackaton.backend.exceptions.UserException;
import com.oddo.hackaton.backend.model.dto.reponse.MatchResponse;
import com.oddo.hackaton.backend.model.entity.Match;
import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.model.enums.MatchStatus;
import com.oddo.hackaton.backend.model.enums.PickStatus;
import com.oddo.hackaton.backend.repository.MatchRepository;
import com.oddo.hackaton.backend.repository.PickRequestRepository;
import com.oddo.hackaton.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final PickRequestRepository pickRequestRepository;
    private final UserRepository userRepository;

    /**
     * Picker sends a pick request - creates a PENDING match.
     */
    @Transactional
    public MatchResponse createMatch(Long pickRequestId, String pickerEmail) {
        User picker = userRepository.findByEmail(pickerEmail)
                .orElseThrow(() -> new RuntimeException("Picker user not found"));

        PickRequest pickRequest = pickRequestRepository.findById(pickRequestId)
                .orElseThrow(() -> new RuntimeException("Pick request not found"));

        // Validation
        if (pickRequest.getStatus() != PickStatus.ACTIVE) {
            throw new RuntimeException("Pick request is not active");
        }

        if (pickRequest.getUser().getId().equals(picker.getId())) {
            throw new RuntimeException("Cannot pick your own request");
        }

        // Check if match already exists
        if (matchRepository.findByPickRequestIdAndPickerUserId(pickRequestId, picker.getId()).isPresent()) {
            throw new RuntimeException("You already sent a pick request for this");
        }

        // Create match
        Match match = Match.builder()
                .pickRequest(pickRequest)
                .pickerUser(picker)
                .requesterUser(pickRequest.getUser())
                .status(MatchStatus.PENDING)
                .build();

        Match savedMatch = matchRepository.save(match);

        // Update pick request status
        pickRequest.setStatus(PickStatus.MATCHED);
        pickRequestRepository.save(pickRequest);

        return mapToResponse(savedMatch);
    }

    /**
     * Requester approves or declines the match.
     */
    @Transactional
    public MatchResponse respondToMatch(Long matchId, Boolean approved, String requesterEmail) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validation
        if (!match.getRequesterUser().getId().equals(requester.getId())) {
            throw new RuntimeException("Only the requester can respond to this match");
        }

        if (match.getStatus() != MatchStatus.PENDING) {
            throw new RuntimeException("Match is not pending");
        }

        // Update match status
        if (approved) {
            match.setStatus(MatchStatus.ACCEPTED);
            match.setApprovedAt(LocalDateTime.now());
        } else {
            match.setStatus(MatchStatus.DECLINED);
            // Reset pick request to ACTIVE so others can pick
            PickRequest pickRequest = match.getPickRequest();
            pickRequest.setStatus(PickStatus.ACTIVE);
            pickRequestRepository.save(pickRequest);
        }

        Match updatedMatch = matchRepository.save(match);
        return mapToResponse(updatedMatch);
    }

    private MatchResponse mapToResponse(Match match) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        return MatchResponse.builder()
                .matchId(match.getId())
                .pickRequestId(match.getPickRequest().getId())
                .pickerId(match.getPickerUser().getId())
                .pickerName(match.getPickerUser().getName())
                .requesterId(match.getRequesterUser().getId())
                .requesterName(match.getRequesterUser().getName())
                .status(match.getStatus())
                .createdAt(match.getCreatedAt().format(formatter))
                .approvedAt(match.getApprovedAt() != null ? match.getApprovedAt().format(formatter) : null)
                .build();
    }
}
