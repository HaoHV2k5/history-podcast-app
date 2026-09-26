package com.prm.contract.service.impl;

import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.mapper.ContractMapper;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.service.ContractService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {

    private final ContractRepository repository;
    private final ContractMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
    }

    @Override
    public ContractResponse create(ContractRequest request) {
        Contract entity = mapper.toEntity(request);
        if (request.getHireRequestId() != null) {
            entity.setHireRequest(entityManager.getReference(com.prm.contract.entity.HireRequest.class, request.getHireRequestId()));
        }
        Contract saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ContractResponse update(Long id, ContractRequest request) {
        Contract entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getHireRequestId() != null) {
            entity.setHireRequest(entityManager.getReference(com.prm.contract.entity.HireRequest.class, request.getHireRequestId()));
        }
        Contract updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Contract not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
