package com.prm.common.service.impl;

import com.prm.common.dto.request.SystemConfigRequest;
import com.prm.common.dto.response.SystemConfigResponse;
import com.prm.common.entity.SystemConfig;
import com.prm.common.mapper.SystemConfigMapper;
import com.prm.common.repository.SystemConfigRepository;
import com.prm.common.service.SystemConfigService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigRepository repository;
    private final SystemConfigMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemConfigResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("SystemConfig not found with id: " + id));
    }

    @Override
    public SystemConfigResponse create(SystemConfigRequest request) {
        SystemConfig entity = mapper.toEntity(request);
        if (request.getUpdatedByUserId() != null) {
            entity.setUpdatedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUpdatedByUserId()));
        }
        SystemConfig saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public SystemConfigResponse update(Long id, SystemConfigRequest request) {
        SystemConfig entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SystemConfig not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUpdatedByUserId() != null) {
            entity.setUpdatedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUpdatedByUserId()));
        }
        SystemConfig updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("SystemConfig not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
