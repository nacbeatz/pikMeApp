package com.oddo.hackaton.backend.model.enums;

public enum MatchStatus
{
    PENDING,     // Picker sent request, waiting for requester approval
    ACCEPTED,    // Requester approved, match created!
    DECLINED,    // Requester said no
    COMPLETED    // Meetup successfully finished
}
