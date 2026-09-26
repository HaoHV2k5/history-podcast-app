package com.prm.membership.service.impl;

import com.prm.membership.dto.request.MembershipPaymentRequest;
import com.prm.membership.dto.response.MembershipPaymentResponse;
import com.prm.membership.entity.MembershipPayment;
import com.prm.membership.mapper.MembershipPaymentMapper;
import com.prm.membership.repository.MembershipPaymentRepository;
import com.prm.membership.service.MembershipPaymentService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MembershipPaymentServiceImpl implements MembershipPaymentService {

    private final MembershipPaymentRepository repository;
    private final MembershipPaymentMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<MembershipPaymentResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MembershipPaymentResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("MembershipPayment not found with id: " + id));
    }

    @Override
    public MembershipPaymentResponse create(MembershipPaymentRequest request) {
        MembershipPayment entity = mapper.toEntity(request);
        if (request.getMembershipId() != null) {
            entity.setMembership(entityManager.getReference(com.prm.membership.entity.Membership.class, request.getMembershipId()));
        }
        MembershipPayment saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public MembershipPaymentResponse update(Long id, MembershipPaymentRequest request) {
        MembershipPayment entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MembershipPayment not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getMembershipId() != null) {
            entity.setMembership(entityManager.getReference(com.prm.membership.entity.Membership.class, request.getMembershipId()));
        }
        MembershipPayment updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("MembershipPayment not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
