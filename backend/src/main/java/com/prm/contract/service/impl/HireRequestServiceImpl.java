package com.prm.contract.service.impl;

import com.prm.contract.dto.request.HireRequestRequest;
import com.prm.contract.dto.response.HireRequestResponse;
import com.prm.contract.entity.HireRequest;
import com.prm.contract.mapper.HireRequestMapper;
import com.prm.contract.repository.HireRequestRepository;
import com.prm.contract.service.HireRequestService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class HireRequestServiceImpl implements HireRequestService {

    private final HireRequestRepository repository;
    private final HireRequestMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<HireRequestResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public HireRequestResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("HireRequest not found with id: " + id));
    }

    @Override
    public HireRequestResponse create(HireRequestRequest request) {
        HireRequest entity = mapper.toEntity(request);
        if (request.getCreatorId() != null) {
            entity.setCreator(entityManager.getReference(com.prm.identity.entity.User.class, request.getCreatorId()));
        }
        if (request.getNarratorId() != null) {
            entity.setNarrator(entityManager.getReference(com.prm.identity.entity.User.class, request.getNarratorId()));
        }
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        HireRequest saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public HireRequestResponse update(Long id, HireRequestRequest request) {
        HireRequest entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HireRequest not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getCreatorId() != null) {
            entity.setCreator(entityManager.getReference(com.prm.identity.entity.User.class, request.getCreatorId()));
        }
        if (request.getNarratorId() != null) {
            entity.setNarrator(entityManager.getReference(com.prm.identity.entity.User.class, request.getNarratorId()));
        }
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        HireRequest updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("HireRequest not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
