package com.prm.narrator.service.impl;

import com.prm.narrator.dto.request.NarratorProfileRequest;
import com.prm.narrator.dto.response.NarratorProfileResponse;
import com.prm.narrator.entity.NarratorProfile;
import com.prm.narrator.mapper.NarratorProfileMapper;
import com.prm.narrator.repository.NarratorProfileRepository;
import com.prm.narrator.service.NarratorProfileService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NarratorProfileServiceImpl implements NarratorProfileService {

    private final NarratorProfileRepository repository;
    private final NarratorProfileMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<NarratorProfileResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NarratorProfileResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("NarratorProfile not found with id: " + id));
    }

    @Override
    public NarratorProfileResponse create(NarratorProfileRequest request) {
        NarratorProfile entity = mapper.toEntity(request);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        NarratorProfile saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public NarratorProfileResponse update(Long id, NarratorProfileRequest request) {
        NarratorProfile entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NarratorProfile not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        NarratorProfile updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("NarratorProfile not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
