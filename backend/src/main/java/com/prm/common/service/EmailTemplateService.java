package com.prm.common.service;

import com.prm.common.dto.request.EmailTemplatePreviewRequest;
import com.prm.common.dto.request.EmailTemplateRequest;
import com.prm.common.dto.request.EmailTemplateTestSendRequest;
import com.prm.common.dto.response.EmailTemplatePreviewResponse;
import com.prm.common.dto.response.EmailTemplateResponse;

import java.util.List;
import java.util.Map;

public interface EmailTemplateService {
    List<EmailTemplateResponse> findAll();
    EmailTemplateResponse findById(Long id);
    EmailTemplateResponse findByCode(String code);
    EmailTemplateResponse create(EmailTemplateRequest request);
    EmailTemplateResponse update(Long id, EmailTemplateRequest request);
    void delete(Long id);

    /**
     * Render xem trước giao diện email với các biến giả lập
     */
    EmailTemplatePreviewResponse preview(Long id, EmailTemplatePreviewRequest request);

    /**
     * Gửi thử email tới địa chỉ chỉ định để kiểm tra giao diện hiển thị thực tế
     */
    void sendTestEmail(Long id, EmailTemplateTestSendRequest request);
}
