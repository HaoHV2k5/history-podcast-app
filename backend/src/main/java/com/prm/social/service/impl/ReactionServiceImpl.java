package com.prm.social.service.impl;

import com.prm.social.dto.request.ReactionRequest;
import com.prm.social.dto.response.ReactionResponse;
import com.prm.social.entity.Reaction;
import com.prm.social.mapper.ReactionMapper;
import com.prm.social.repository.ReactionRepository;
import com.prm.social.service.ReactionService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository repository;
    private final ReactionMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ReactionResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReactionResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Reaction not found with id: " + id));
    }

    @Override
    public ReactionResponse create(ReactionRequest request) {
        Reaction entity = mapper.toEntity(request);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        Reaction saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ReactionResponse update(Long id, ReactionRequest request) {
        Reaction entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reaction not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        Reaction updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Reaction not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
