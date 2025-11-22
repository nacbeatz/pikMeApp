package com.oddo.hackaton.backend.controllers;

import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.service.PickRequestService;
import com.oddo.hackaton.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/pick-requests")
public class PickRequestController {
    @Autowired private PickRequestService pickRequestService;
    @Autowired private UserService userService;

    @PostMapping()
    public ResponseEntity<PickRequest> createPickRequest(@RequestBody PickRequest pickRequest) {
        User userWithUpdatedInterests = pickRequest.getUser();
        userWithUpdatedInterests.addInterests(pickRequest.getActivityType());
        userService.updateUser(userWithUpdatedInterests);

        return new ResponseEntity<>(pickRequestService.createPickRequest(pickRequest), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PickRequest> editPickRequest(@PathVariable Long id, @RequestBody PickRequest pickRequest) {
        Optional<PickRequest> result = pickRequestService.editPickRequest(id, pickRequest);
        return result.isPresent() ? ResponseEntity.ok(result.get()) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePickRequest(@PathVariable Long id) {
        pickRequestService.deletePickRequest(id);
        return ResponseEntity.ok().build();
    }
}
