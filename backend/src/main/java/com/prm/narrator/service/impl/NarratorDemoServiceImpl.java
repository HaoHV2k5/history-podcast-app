package com.prm.narrator.service.impl;

import com.prm.narrator.dto.request.NarratorDemoRequest;
import com.prm.narrator.dto.response.NarratorDemoResponse;
import com.prm.narrator.entity.NarratorDemo;
import com.prm.narrator.mapper.NarratorDemoMapper;
import com.prm.narrator.repository.NarratorDemoRepository;
import com.prm.narrator.service.NarratorDemoService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NarratorDemoServiceImpl implements NarratorDemoService {

    private final NarratorDemoRepository repository;
    private final NarratorDemoMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<NarratorDemoResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public NarratorDemoResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("NarratorDemo not found with id: " + id));
    }

    @Override
    public NarratorDemoResponse create(NarratorDemoRequest request) {
        NarratorDemo entity = mapper.toEntity(request);
        if (request.getNarratorProfileId() != null) {
            entity.setNarratorProfile(entityManager.getReference(com.prm.narrator.entity.NarratorProfile.class, request.getNarratorProfileId()));
        }
        NarratorDemo saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public NarratorDemoResponse update(Long id, NarratorDemoRequest request) {
        NarratorDemo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NarratorDemo not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getNarratorProfileId() != null) {
            entity.setNarratorProfile(entityManager.getReference(com.prm.narrator.entity.NarratorProfile.class, request.getNarratorProfileId()));
        }
        NarratorDemo updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("NarratorDemo not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
