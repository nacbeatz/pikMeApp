package com.oddo.hackaton.backend.model.enums;

public enum PickStatus
{
    ACTIVE,      // Visible on map, waiting to be picked
    MATCHED,     // Someone accepted the peek request
    COMPLETED,   // Meetup finished successfully
    EXPIRED,     // Time limit passed (e.g., 30 min)
    CANCELLED    // User cancelled before being picked
}
