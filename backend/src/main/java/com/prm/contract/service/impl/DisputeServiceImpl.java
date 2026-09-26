package com.prm.contract.service.impl;

import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import com.prm.contract.entity.Dispute;
import com.prm.contract.mapper.DisputeMapper;
import com.prm.contract.repository.DisputeRepository;
import com.prm.contract.service.DisputeService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DisputeServiceImpl implements DisputeService {

    private final DisputeRepository repository;
    private final DisputeMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + id));
    }

    @Override
    public DisputeResponse create(DisputeRequest request) {
        Dispute entity = mapper.toEntity(request);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        if (request.getRaisedByUserId() != null) {
            entity.setRaisedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getRaisedByUserId()));
        }
        if (request.getResolvedByUserId() != null) {
            entity.setResolvedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getResolvedByUserId()));
        }
        Dispute saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public DisputeResponse update(Long id, DisputeRequest request) {
        Dispute entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        if (request.getRaisedByUserId() != null) {
            entity.setRaisedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getRaisedByUserId()));
        }
        if (request.getResolvedByUserId() != null) {
            entity.setResolvedByUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getResolvedByUserId()));
        }
        Dispute updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Dispute not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
