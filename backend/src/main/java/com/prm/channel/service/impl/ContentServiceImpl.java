package com.prm.channel.service.impl;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;
import com.prm.channel.entity.Content;
import com.prm.channel.mapper.ContentMapper;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.service.ContentService;
import com.prm.common.exception.ResourceNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ContentServiceImpl implements ContentService {

    private final ContentRepository repository;
    private final ContentMapper mapper;
    private final EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public List<ContentResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContentResponse findById(Long id) {
        return repository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));
    }

    @Override
    public ContentResponse create(ContentRequest request) {
        Content entity = mapper.toEntity(request);
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Content saved = repository.save(entity);
        return mapper.toResponse(saved);
    }

    @Override
    public ContentResponse update(Long id, ContentRequest request) {
        Content entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found with id: " + id));
        mapper.updateEntityFromRequest(request, entity);
        if (request.getChannelId() != null) {
            entity.setChannel(entityManager.getReference(com.prm.channel.entity.Channel.class, request.getChannelId()));
        }
        Content updated = repository.save(entity);
        return mapper.toResponse(updated);
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Content not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
