package com.prm.identity.service.impl;

import com.prm.identity.dto.request.RoleRequest;
import com.prm.identity.dto.response.RoleResponse;
import com.prm.identity.entity.Role;
import com.prm.identity.mapper.RoleMapper;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.service.RoleService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {

    private final RoleRepository repository;
    private final RoleMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
    }

    @Override
    public RoleResponse create(RoleRequest request) {
        Role entity = mapper.toEntity(request);

        Role saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public RoleResponse update(Long id, RoleRequest request) {
        Role entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);

        Role updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Role not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
