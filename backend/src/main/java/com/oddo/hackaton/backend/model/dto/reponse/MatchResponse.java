package com.oddo.hackaton.backend.model.dto.reponse;


import com.oddo.hackaton.backend.model.enums.MatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {
    private Long matchId;
    private Long pickRequestId;
    private Long pickerId;
    private String pickerName;
    private Long requesterId;
    private String requesterName;
    private MatchStatus status;
    private String createdAt;
    private String approvedAt;
}
