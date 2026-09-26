package com.prm.wallet.service.impl;

import com.prm.wallet.dto.request.WalletRequest;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.entity.Wallet;
import com.prm.wallet.mapper.WalletMapper;
import com.prm.wallet.repository.WalletRepository;
import com.prm.wallet.service.WalletService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WalletServiceImpl implements WalletService {

    private final WalletRepository repository;
    private final WalletMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<WalletResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found with id: " + id));
    }

    @Override
    public WalletResponse create(WalletRequest request) {
        Wallet entity = mapper.toEntity(request);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        Wallet saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public WalletResponse update(Long id, WalletRequest request) {
        Wallet entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getUserId() != null) {
            entity.setUser(entityManager.getReference(com.prm.identity.entity.User.class, request.getUserId()));
        }
        Wallet updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Wallet not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
