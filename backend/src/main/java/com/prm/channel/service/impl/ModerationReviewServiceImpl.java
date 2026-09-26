package com.prm.channel.service.impl;

import com.prm.channel.dto.request.ModerationReviewRequest;
import com.prm.channel.dto.response.ModerationReviewResponse;
import com.prm.channel.entity.ModerationReview;
import com.prm.channel.mapper.ModerationReviewMapper;
import com.prm.channel.repository.ModerationReviewRepository;
import com.prm.channel.service.ModerationReviewService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ModerationReviewServiceImpl implements ModerationReviewService {

    private final ModerationReviewRepository repository;
    private final ModerationReviewMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ModerationReviewResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationReviewResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("ModerationReview not found with id: " + id));
    }

    @Override
    public ModerationReviewResponse create(ModerationReviewRequest request) {
        ModerationReview entity = mapper.toEntity(request);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getModeratorId() != null) {
            entity.setModerator(entityManager.getReference(com.prm.identity.entity.User.class, request.getModeratorId()));
        }
        ModerationReview saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ModerationReviewResponse update(Long id, ModerationReviewRequest request) {
        ModerationReview entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ModerationReview not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getModeratorId() != null) {
            entity.setModerator(entityManager.getReference(com.prm.identity.entity.User.class, request.getModeratorId()));
        }
        ModerationReview updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ModerationReview not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
