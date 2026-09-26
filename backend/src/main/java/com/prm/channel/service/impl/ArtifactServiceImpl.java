package com.prm.channel.service.impl;

import com.prm.channel.dto.request.ArtifactRequest;
import com.prm.channel.dto.response.ArtifactResponse;
import com.prm.channel.entity.Artifact;
import com.prm.channel.mapper.ArtifactMapper;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.service.ArtifactService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ArtifactServiceImpl implements ArtifactService {

    private final ArtifactRepository repository;
    private final ArtifactMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ArtifactResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ArtifactResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Artifact not found with id: " + id));
    }

    @Override
    public ArtifactResponse create(ArtifactRequest request) {
        Artifact entity = mapper.toEntity(request);
        if (request.getContentId() != null) {
            entity.setContent(entityManager.getReference(com.prm.channel.entity.Content.class, request.getContentId()));
        }
        Artifact saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ArtifactResponse update(Long id, ArtifactRequest request) {
        Artifact entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artifact not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getContentId() != null) {
            entity.setContent(entityManager.getReference(com.prm.channel.entity.Content.class, request.getContentId()));
        }
        Artifact updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Artifact not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
