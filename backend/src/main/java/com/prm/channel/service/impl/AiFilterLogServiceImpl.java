package com.prm.channel.service.impl;

import com.prm.channel.dto.request.AiFilterLogRequest;
import com.prm.channel.dto.response.AiFilterLogResponse;
import com.prm.channel.entity.AiFilterLog;
import com.prm.channel.mapper.AiFilterLogMapper;
import com.prm.channel.repository.AiFilterLogRepository;
import com.prm.channel.service.AiFilterLogService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AiFilterLogServiceImpl implements AiFilterLogService {

    private final AiFilterLogRepository repository;
    private final AiFilterLogMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<AiFilterLogResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AiFilterLogResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("AiFilterLog not found with id: " + id));
    }

    @Override
    public AiFilterLogResponse create(AiFilterLogRequest request) {
        AiFilterLog entity = mapper.toEntity(request);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        AiFilterLog saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public AiFilterLogResponse update(Long id, AiFilterLogRequest request) {
        AiFilterLog entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiFilterLog not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        AiFilterLog updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("AiFilterLog not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
