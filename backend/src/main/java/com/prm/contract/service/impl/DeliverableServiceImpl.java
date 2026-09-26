package com.prm.contract.service.impl;

import com.prm.contract.dto.request.DeliverableRequest;
import com.prm.contract.dto.response.DeliverableResponse;
import com.prm.contract.entity.Deliverable;
import com.prm.contract.mapper.DeliverableMapper;
import com.prm.contract.repository.DeliverableRepository;
import com.prm.contract.service.DeliverableService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliverableServiceImpl implements DeliverableService {

    private final DeliverableRepository repository;
    private final DeliverableMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<DeliverableResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DeliverableResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Deliverable not found with id: " + id));
    }

    @Override
    public DeliverableResponse create(DeliverableRequest request) {
        Deliverable entity = mapper.toEntity(request);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        Deliverable saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public DeliverableResponse update(Long id, DeliverableRequest request) {
        Deliverable entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deliverable not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        Deliverable updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Deliverable not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
