package com.prm.identity.service.impl;

import com.prm.identity.dto.request.RefreshTokenRequest;
import com.prm.identity.dto.response.RefreshTokenResponse;
import com.prm.identity.entity.RefreshToken;
import com.prm.identity.mapper.RefreshTokenMapper;
import com.prm.identity.repository.RefreshTokenRepository;
import com.prm.identity.service.RefreshTokenService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final RefreshTokenMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<RefreshTokenResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RefreshTokenResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("RefreshToken not found with id: " + id));
    }

    @Override
    public RefreshTokenResponse create(RefreshTokenRequest request) {
        RefreshToken entity = mapper.toEntity(request);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        RefreshToken saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public RefreshTokenResponse update(Long id, RefreshTokenRequest request) {
        RefreshToken entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RefreshToken not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        RefreshToken updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("RefreshToken not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
