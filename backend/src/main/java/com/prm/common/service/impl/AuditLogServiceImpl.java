package com.prm.common.service.impl;

import com.prm.common.dto.request.AuditLogRequest;
import com.prm.common.dto.response.AuditLogResponse;
import com.prm.common.entity.AuditLog;
import com.prm.common.mapper.AuditLogMapper;
import com.prm.common.repository.AuditLogRepository;
import com.prm.common.service.AuditLogService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository repository;
    private final AuditLogMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AuditLogResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found with id: " + id));
    }

    @Override
    public AuditLogResponse create(AuditLogRequest request) {
        AuditLog entity = mapper.toEntity(request);
        if (request.getActorId() != null) {
            entity.setActor(entityManager.getReference(com.prm.identity.entity.User.class, request.getActorId()));
        }
        AuditLog saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public AuditLogResponse update(Long id, AuditLogRequest request) {
        AuditLog entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AuditLog not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getActorId() != null) {
            entity.setActor(entityManager.getReference(com.prm.identity.entity.User.class, request.getActorId()));
        }
        AuditLog updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("AuditLog not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
