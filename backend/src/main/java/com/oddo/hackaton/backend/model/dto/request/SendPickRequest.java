package com.oddo.hackaton.backend.model.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendPickRequest
{
    @NotNull(message = "Pick request ID is required")
    private long pickRequestId;
}
