package com.prm.contract.repository;

import com.prm.contract.constant.ApplicationStatus;
import com.prm.contract.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByPostId(Long postId);

    Page<Application> findByPostId(Long postId, Pageable pageable);

    Optional<Application> findByPostIdAndApplicantId(Long postId, Long applicantId);

    boolean existsByPostIdAndApplicantId(Long postId, Long applicantId);

    Page<Application> findByApplicantId(Long applicantId, Pageable pageable);

    List<Application> findByPostIdAndStatus(Long postId, ApplicationStatus status);
}
