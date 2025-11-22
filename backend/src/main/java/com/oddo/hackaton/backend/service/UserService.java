package com.oddo.hackaton.backend.service;

import com.oddo.hackaton.backend.model.entity.User;
import com.oddo.hackaton.backend.repository.UserRepository;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    public List<User> getAllUsers() {
        return repository.findAll();
    }

    public @Nullable Optional<User> getUser(Long id) {
        return repository
                .findById(id);
//                .orElseThrow(() -> new UserException(String.format("The user %d is not found.", id)));
    }

    public User updateUser(User newUserInfo) {
        return repository.save(newUserInfo);
    }
}
