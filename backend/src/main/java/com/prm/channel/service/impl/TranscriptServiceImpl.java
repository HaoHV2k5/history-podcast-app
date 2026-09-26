package com.prm.channel.service.impl;

import com.prm.channel.dto.request.TranscriptRequest;
import com.prm.channel.dto.response.TranscriptResponse;
import com.prm.channel.entity.Transcript;
import com.prm.channel.mapper.TranscriptMapper;
import com.prm.channel.repository.TranscriptRepository;
import com.prm.channel.service.TranscriptService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TranscriptServiceImpl implements TranscriptService {

    private final TranscriptRepository repository;
    private final TranscriptMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<TranscriptResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TranscriptResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Transcript not found with id: " + id));
    }

    @Override
    public TranscriptResponse create(TranscriptRequest request) {
        Transcript entity = mapper.toEntity(request);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        Transcript saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public TranscriptResponse update(Long id, TranscriptRequest request) {
        Transcript entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transcript not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        Transcript updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Transcript not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
