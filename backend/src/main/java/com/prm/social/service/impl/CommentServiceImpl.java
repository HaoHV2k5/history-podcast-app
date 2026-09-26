package com.prm.social.service.impl;

import com.prm.social.dto.request.CommentRequest;
import com.prm.social.dto.response.CommentResponse;
import com.prm.social.entity.Comment;
import com.prm.social.mapper.CommentMapper;
import com.prm.social.repository.CommentRepository;
import com.prm.social.service.CommentService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentServiceImpl implements CommentService {

    private final CommentRepository repository;
    private final CommentMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CommentResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
    }

    @Override
    public CommentResponse create(CommentRequest request) {
        Comment entity = mapper.toEntity(request);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        if (request.getParentCommentId() != null) {
            entity.setParentComment(entityManager.getReference(com.prm.social.entity.Comment.class, request.getParentCommentId()));
        }
        Comment saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public CommentResponse update(Long id, CommentRequest request) {
        Comment entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getArtifactId() != null) {
            entity.setArtifact(entityManager.getReference(com.prm.channel.entity.Artifact.class, request.getArtifactId()));
        }
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        if (request.getParentCommentId() != null) {
            entity.setParentComment(entityManager.getReference(com.prm.social.entity.Comment.class, request.getParentCommentId()));
        }
        Comment updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Comment not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
