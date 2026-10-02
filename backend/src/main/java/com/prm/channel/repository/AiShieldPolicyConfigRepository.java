package com.prm.channel.repository;

import com.prm.channel.entity.AiShieldPolicyConfig;
import com.prm.common.enums.AiShieldTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiShieldPolicyConfigRepository extends JpaRepository<AiShieldPolicyConfig, Long> {

    Optional<AiShieldPolicyConfig> findByTier(AiShieldTier tier);

    List<AiShieldPolicyConfig> findByIsActiveTrueOrderByDisplayOrderAscMinScoreAsc();

    List<AiShieldPolicyConfig> findAllByOrderByDisplayOrderAscMinScoreAsc();
}
