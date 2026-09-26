package com.prm.identity.service.impl;

import com.prm.identity.dto.request.UserRequest;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.UserMapper;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.service.UserService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final UserMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Override
    public UserResponse create(UserRequest request) {
        User entity = mapper.toEntity(request);
        if (request.getRoleId() != null) {
            entity.setRole(entityManager.getReference(com.prm.identity.entity.Role.class, request.getRoleId()));
        }
        User saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public UserResponse update(Long id, UserRequest request) {
        User entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getRoleId() != null) {
            entity.setRole(entityManager.getReference(com.prm.identity.entity.Role.class, request.getRoleId()));
        }
        User updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
