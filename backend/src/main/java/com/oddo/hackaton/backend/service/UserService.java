package com.oddo.hackaton.backend.service;

import com.oddo.hackaton.backend.exceptions.UserException;
import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.repository.UserRepository;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    public List<User> getAllUsers() {
        return repository.findAllUsers();
    }

    public @Nullable User getUser(Long id) {
        return repository
                .findById(id)
                .orElseThrow(() -> new UserException(String.format("The user %d is not found.", id)));
    }
}
