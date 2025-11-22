package com.oddo.hackaton.backend.exceptions;

public class MessageException extends RuntimeException {
    public MessageException() { }
    public MessageException(String message) { super(message); }
}
