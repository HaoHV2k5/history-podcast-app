package com.prm.common.service.impl;

import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.response.EmailTemplateResponse;
import com.prm.common.entity.EmailTemplate;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.repository.EmailTemplateRepository;
import com.prm.common.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmailTemplateServiceImpl implements EmailTemplateService {

    private final EmailTemplateRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<EmailTemplateResponse> findAll() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplateResponse findById(Long id) {
        EmailTemplate template = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy mẫu email với ID: " + id));
        return mapToResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    public EmailTemplateResponse findByCode(String code) {
        EmailTemplate template = repository.findByCode(code)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy mẫu email với mã: " + code));
        return mapToResponse(template);
    }

    @Override
    public EmailTemplateResponse create(EmailTemplateRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mã email template đã tồn tại: " + request.getCode());
        }

        EmailTemplate template = EmailTemplate.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .subject(request.getSubject().trim())
                .htmlContent(request.getHtmlContent())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus().trim() : "ACTIVE")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return mapToResponse(repository.save(template));
    }

    @Override
    public EmailTemplateResponse update(Long id, EmailTemplateRequest request) {
        EmailTemplate template = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy mẫu email với ID: " + id));

        if (!template.getCode().equalsIgnoreCase(request.getCode().trim()) && repository.existsByCode(request.getCode().trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mã email template đã được sử dụng: " + request.getCode());
        }

        template.setCode(request.getCode().trim());
        template.setName(request.getName().trim());
        template.setSubject(request.getSubject().trim());
        template.setHtmlContent(request.getHtmlContent());
        template.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            template.setStatus(request.getStatus().trim());
        }
        template.setUpdatedAt(Instant.now());

        return mapToResponse(repository.save(template));
    }

    @Override
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy mẫu email với ID: " + id);
        }
        repository.deleteById(id);
    }

    private EmailTemplateResponse mapToResponse(EmailTemplate template) {
        return EmailTemplateResponse.builder()
                .id(template.getId())
                .code(template.getCode())
                .name(template.getName())
                .subject(template.getSubject())
                .htmlContent(template.getHtmlContent())
                .description(template.getDescription())
                .status(template.getStatus())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
