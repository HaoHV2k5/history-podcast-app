package com.prm.wallet.service.impl;

import com.prm.wallet.dto.request.WalletTransactionRequest;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import com.prm.wallet.entity.WalletTransaction;
import com.prm.wallet.mapper.WalletTransactionMapper;
import com.prm.wallet.repository.WalletTransactionRepository;
import com.prm.wallet.service.WalletTransactionService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WalletTransactionServiceImpl implements WalletTransactionService {

    private final WalletTransactionRepository repository;
    private final WalletTransactionMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WalletTransactionResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("WalletTransaction not found with id: " + id));
    }

    @Override
    public WalletTransactionResponse create(WalletTransactionRequest request) {
        WalletTransaction entity = mapper.toEntity(request);
        if (request.getWalletId() != null) {
            entity.setWallet(entityManager.getReference(com.prm.wallet.entity.Wallet.class, request.getWalletId()));
        }
        WalletTransaction saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public WalletTransactionResponse update(Long id, WalletTransactionRequest request) {
        WalletTransaction entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WalletTransaction not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getWalletId() != null) {
            entity.setWallet(entityManager.getReference(com.prm.wallet.entity.Wallet.class, request.getWalletId()));
        }
        WalletTransaction updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("WalletTransaction not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
