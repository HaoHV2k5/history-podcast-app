package com.prm.membership.service.impl;

import com.prm.membership.dto.request.MembershipRequest;
import com.prm.membership.dto.response.MembershipResponse;
import com.prm.membership.entity.Membership;
import com.prm.membership.mapper.MembershipMapper;
import com.prm.membership.repository.MembershipRepository;
import com.prm.membership.service.MembershipService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MembershipServiceImpl implements MembershipService {

    private final MembershipRepository repository;
    private final MembershipMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<MembershipResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MembershipResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + id));
    }

    @Override
    public MembershipResponse create(MembershipRequest request) {
        Membership entity = mapper.toEntity(request);
        if (request.getViewerId() != null) {
            entity.setViewer(entityManager.getReference(com.prm.identity.entity.User.class, request.getViewerId()));
        }
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Membership saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public MembershipResponse update(Long id, MembershipRequest request) {
        Membership entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getViewerId() != null) {
            entity.setViewer(entityManager.getReference(com.prm.identity.entity.User.class, request.getViewerId()));
        }
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Membership updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Membership not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
