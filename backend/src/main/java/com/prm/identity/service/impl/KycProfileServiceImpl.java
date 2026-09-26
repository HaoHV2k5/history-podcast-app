package com.prm.identity.service.impl;

import com.prm.identity.dto.request.KycProfileRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.entity.KycProfile;
import com.prm.identity.mapper.KycProfileMapper;
import com.prm.identity.repository.KycProfileRepository;
import com.prm.identity.service.KycProfileService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class KycProfileServiceImpl implements KycProfileService {

    private final KycProfileRepository repository;
    private final KycProfileMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<KycProfileResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public KycProfileResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("KycProfile not found with id: " + id));
    }

    @Override
    public KycProfileResponse create(KycProfileRequest request) {
        KycProfile entity = mapper.toEntity(request);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        KycProfile saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public KycProfileResponse update(Long id, KycProfileRequest request) {
        KycProfile entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("KycProfile not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        KycProfile updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("KycProfile not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
