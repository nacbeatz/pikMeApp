package com.oddo.hackaton.backend.model.enums;

public enum MeetupStatus
{
    NOT_STARTED,    // Match accepted, meetup not started yet
    IN_PROGRESS,    // Both users confirmed "Meetup Started"
    COMPLETED,      // Both users confirmed "Meetup Ended"
    CANCELLED       // Someone cancelled before starting
}
