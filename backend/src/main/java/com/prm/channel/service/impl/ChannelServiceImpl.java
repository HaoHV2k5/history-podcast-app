package com.prm.channel.service.impl;

import com.prm.channel.dto.request.ChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.entity.Channel;
import com.prm.channel.mapper.ChannelMapper;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.service.ChannelService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository repository;
    private final ChannelMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ChannelResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ChannelResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + id));
    }

    @Override
    public ChannelResponse create(ChannelRequest request) {
        Channel entity = mapper.toEntity(request);
        if (request.getCreatorId() != null) {
            entity.setCreator(entityManager.getReference(com.prm.identity.entity.User.class, request.getCreatorId()));
        }
        Channel saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ChannelResponse update(Long id, ChannelRequest request) {
        Channel entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Channel not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getCreatorId() != null) {
            entity.setCreator(entityManager.getReference(com.prm.identity.entity.User.class, request.getCreatorId()));
        }
        Channel updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Channel not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
