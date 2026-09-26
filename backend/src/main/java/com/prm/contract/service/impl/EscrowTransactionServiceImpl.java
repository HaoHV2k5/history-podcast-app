package com.prm.contract.service.impl;

import com.prm.contract.dto.request.EscrowTransactionRequest;
import com.prm.contract.dto.response.EscrowTransactionResponse;
import com.prm.contract.entity.EscrowTransaction;
import com.prm.contract.mapper.EscrowTransactionMapper;
import com.prm.contract.repository.EscrowTransactionRepository;
import com.prm.contract.service.EscrowTransactionService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EscrowTransactionServiceImpl implements EscrowTransactionService {

    private final EscrowTransactionRepository repository;
    private final EscrowTransactionMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<EscrowTransactionResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EscrowTransactionResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("EscrowTransaction not found with id: " + id));
    }

    @Override
    public EscrowTransactionResponse create(EscrowTransactionRequest request) {
        EscrowTransaction entity = mapper.toEntity(request);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        EscrowTransaction saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public EscrowTransactionResponse update(Long id, EscrowTransactionRequest request) {
        EscrowTransaction entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EscrowTransaction not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getContractId() != null) {
            entity.setContract(entityManager.getReference(com.prm.contract.entity.Contract.class, request.getContractId()));
        }
        EscrowTransaction updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("EscrowTransaction not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
