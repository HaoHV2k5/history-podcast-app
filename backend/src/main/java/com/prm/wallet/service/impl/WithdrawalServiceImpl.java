package com.prm.wallet.service.impl;

import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.entity.Withdrawal;
import com.prm.wallet.mapper.WithdrawalMapper;
import com.prm.wallet.repository.WithdrawalRepository;
import com.prm.wallet.service.WithdrawalService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRepository repository;
    private final WithdrawalMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawalResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal not found with id: " + id));
    }

    @Override
    public WithdrawalResponse create(WithdrawalRequest request) {
        Withdrawal entity = mapper.toEntity(request);
        if (request.getWalletId() != null) {
            entity.setWallet(entityManager.getReference(com.prm.wallet.entity.Wallet.class, request.getWalletId()));
        }
        if (request.getBankAccountId() != null) {
            entity.setBankAccount(entityManager.getReference(com.prm.wallet.entity.BankAccount.class, request.getBankAccountId()));
        }
        Withdrawal saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public WithdrawalResponse update(Long id, WithdrawalRequest request) {
        Withdrawal entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Withdrawal not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getWalletId() != null) {
            entity.setWallet(entityManager.getReference(com.prm.wallet.entity.Wallet.class, request.getWalletId()));
        }
        if (request.getBankAccountId() != null) {
            entity.setBankAccount(entityManager.getReference(com.prm.wallet.entity.BankAccount.class, request.getBankAccountId()));
        }
        Withdrawal updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Withdrawal not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
