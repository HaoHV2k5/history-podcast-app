package com.prm.wallet.service.impl;

import com.prm.wallet.dto.request.BankAccountRequest;
import com.prm.wallet.dto.response.BankAccountResponse;
import com.prm.wallet.entity.BankAccount;
import com.prm.wallet.mapper.BankAccountMapper;
import com.prm.wallet.repository.BankAccountRepository;
import com.prm.wallet.service.BankAccountService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository repository;
    private final BankAccountMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found with id: " + id));
    }

    @Override
    public BankAccountResponse create(BankAccountRequest request) {
        BankAccount entity = mapper.toEntity(request);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        BankAccount saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public BankAccountResponse update(Long id, BankAccountRequest request) {
        BankAccount entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        BankAccount updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("BankAccount not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
