package com.prm.channel.service;

import com.prm.channel.dto.request.AiShieldPolicyConfigRequest;
import com.prm.channel.dto.response.AiShieldPolicyConfigResponse;
import com.prm.common.enums.AiShieldTier;

import java.math.BigDecimal;
import java.util.List;

public interface AiShieldPolicyService {

    List<AiShieldPolicyConfigResponse> getAllConfigs();

    AiShieldPolicyConfigResponse getConfigByTier(AiShieldTier tier);

    AiShieldPolicyConfigResponse updateConfig(AiShieldTier tier, AiShieldPolicyConfigRequest request);

    List<AiShieldPolicyConfigResponse> batchUpdateConfigs(List<AiShieldPolicyConfigRequest> requests);

    List<AiShieldPolicyConfigResponse> resetDefaultConfigs();

    AiShieldTierEvaluation resolveTier(BigDecimal score);

    record AiShieldTierEvaluation(AiShieldTier tier, String label, String actionType) {}
}
