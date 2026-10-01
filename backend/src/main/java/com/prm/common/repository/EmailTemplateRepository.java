package com.prm.common.repository;

import com.prm.common.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    Optional<EmailTemplate> findByCode(String code);

    Optional<EmailTemplate> findByCodeAndStatus(String code, String status);

    boolean existsByCode(String code);
}
