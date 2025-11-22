package com.oddo.hackaton.backend.exceptions;

public class PickRequestException extends RuntimeException{
    public PickRequestException() { }
    public PickRequestException(String message) { super(message); }
}
