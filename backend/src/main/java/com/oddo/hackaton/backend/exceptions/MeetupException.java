package com.oddo.hackaton.backend.exceptions;

public class MeetupException extends RuntimeException{
    public MeetupException() { }
    public MeetupException(String message) { super(message); }
}
