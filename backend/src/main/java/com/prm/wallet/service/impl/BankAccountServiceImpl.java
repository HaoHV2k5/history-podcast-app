package com.prm.wallet.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.exception.ResourceNotFoundException;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import com.prm.wallet.dto.request.BankAccountRequest;
import com.prm.wallet.dto.response.BankAccountResponse;
import com.prm.wallet.entity.BankAccount;
import com.prm.wallet.mapper.BankAccountMapper;
import com.prm.wallet.repository.BankAccountRepository;
import com.prm.wallet.service.BankAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository repository;
    private final BankAccountMapper mapper;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng: " + email));
    }

    private void verifyOwnershipOrAdmin(BankAccount entity, User currentUser) {
        if (SecurityUtils.hasRole("ADMIN")) {
            return;
        }
        if (entity.getUser() == null || !entity.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Bạn không có quyền thao tác trên tài khoản ngân hàng này");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BankAccountResponse> findAll() {
        User currentUser = getCurrentUser();
        if (SecurityUtils.hasRole("ADMIN")) {
            return repository.findAll().stream()
                    .map(mapper::toResponse)
                    .toList();
        }
        return repository.findByUserIdOrderByIdDesc(currentUser.getId()).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse findById(Long id) {
        User currentUser = getCurrentUser();
        BankAccount entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found with id: " + id));
        verifyOwnershipOrAdmin(entity, currentUser);
        return mapper.toResponse(entity);
    }

    @Override
    public BankAccountResponse create(BankAccountRequest request) {
        User currentUser = getCurrentUser();
        BankAccount entity = mapper.toEntity(request);
        entity.setUser(currentUser);
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(Instant.now());
        }
        if (entity.getVerified() == null) {
            entity.setVerified(Boolean.TRUE);
        }
        BankAccount saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public BankAccountResponse update(Long id, BankAccountRequest request) {
        User currentUser = getCurrentUser();
        BankAccount entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found with id: " + id));
        verifyOwnershipOrAdmin(entity, currentUser);
        mapper.updateEntityFromRequest(request, entity);
        if (entity.getUser() == null) {
            entity.setUser(currentUser);
        }
        BankAccount updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        User currentUser = getCurrentUser();
        BankAccount entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount not found with id: " + id));
        verifyOwnershipOrAdmin(entity, currentUser);
        repository.delete(entity);
    }
}
