package com.prm.creator.repository;

import com.prm.creator.entity.CreatorAiSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CreatorAiSettingRepository extends JpaRepository<CreatorAiSetting, Long> {

    Optional<CreatorAiSetting> findByUserId(Long userId);

    Optional<CreatorAiSetting> findByUserEmail(String email);
}
