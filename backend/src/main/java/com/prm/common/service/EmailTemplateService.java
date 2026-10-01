package com.prm.common.service;

import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.response.EmailTemplateResponse;

import java.util.List;

public interface EmailTemplateService {
    List<EmailTemplateResponse> findAll();
    EmailTemplateResponse findById(Long id);
    EmailTemplateResponse findByCode(String code);
    EmailTemplateResponse create(EmailTemplateRequest request);
    EmailTemplateResponse update(Long id, EmailTemplateRequest request);
    void delete(Long id);
}
