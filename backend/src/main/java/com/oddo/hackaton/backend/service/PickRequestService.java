package com.oddo.hackaton.backend.service;

import com.oddo.hackaton.backend.model.entity.PickRequest;
import com.oddo.hackaton.backend.repository.PickRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PickRequestService {
    @Autowired private PickRequestRepository repository;

    public PickRequest createPickRequest(PickRequest pickRequest) {
        return repository.save(pickRequest);
    }

    public Optional<PickRequest> editPickRequest(Long id, PickRequest pickRequest) {
        Optional<PickRequest> pr = repository.findById(id);
        if (pr.isPresent()) {
            pr.get().setSubject(pickRequest.getSubject());
            pr.get().setActivityType(pickRequest.getActivityType());
            return Optional.of(repository.save(pr.get()));
        } else return Optional.empty();
    }

    public void deletePickRequest(Long id) { repository.deleteById(id); }
}
