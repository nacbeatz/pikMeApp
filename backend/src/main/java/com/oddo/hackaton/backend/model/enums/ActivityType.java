package com.oddo.hackaton.backend.model.enums;

public enum ActivityType
{
    COFFEE("☕ Coffee"),
    WALK("🚶 Walk"),
    FOOD("🍔 Food"),
    GAMING("🎮 Gaming"),
    STUDY("📚 Study"),
    MOVIE("🎬 Movie"),
    GYM("💪 Gym"),
    OTHER("🤝 Other");

    private final String displayName;

    ActivityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
