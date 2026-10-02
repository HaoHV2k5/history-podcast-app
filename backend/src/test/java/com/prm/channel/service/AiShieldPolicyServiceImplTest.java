package com.prm.channel.service;

import com.prm.channel.dto.request.AiShieldPolicyConfigRequest;
import com.prm.channel.dto.response.AiShieldPolicyConfigResponse;
import com.prm.channel.entity.AiShieldPolicyConfig;
import com.prm.channel.repository.AiShieldPolicyConfigRepository;
import com.prm.channel.service.impl.AiShieldPolicyServiceImpl;
import com.prm.common.enums.AiShieldTier;
import com.prm.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiShieldPolicyServiceImplTest {

    @Mock
    private AiShieldPolicyConfigRepository repository;

    @InjectMocks
    private AiShieldPolicyServiceImpl service;

    private AiShieldPolicyConfig redConfig;
    private AiShieldPolicyConfig fairConfig;
    private AiShieldPolicyConfig goodConfig;
    private AiShieldPolicyConfig excellentConfig;

    @BeforeEach
    void setUp() {
        redConfig = AiShieldPolicyConfig.builder()
                .id(1L)
                .tier(AiShieldTier.RED_ALERT)
                .label("Báo động đỏ")
                .minScore(BigDecimal.ZERO)
                .maxScore(BigDecimal.valueOf(50.0))
                .isActive(true)
                .displayOrder(1)
                .build();

        fairConfig = AiShieldPolicyConfig.builder()
                .id(2L)
                .tier(AiShieldTier.FAIR)
                .label("Khá")
                .minScore(BigDecimal.valueOf(50.0))
                .maxScore(BigDecimal.valueOf(80.0))
                .isActive(true)
                .displayOrder(2)
                .build();

        goodConfig = AiShieldPolicyConfig.builder()
                .id(3L)
                .tier(AiShieldTier.GOOD)
                .label("Tốt")
                .minScore(BigDecimal.valueOf(80.0))
                .maxScore(BigDecimal.valueOf(90.0))
                .isActive(true)
                .displayOrder(3)
                .build();

        excellentConfig = AiShieldPolicyConfig.builder()
                .id(4L)
                .tier(AiShieldTier.EXCELLENT)
                .label("Xuất sắc")
                .minScore(BigDecimal.valueOf(90.0))
                .maxScore(BigDecimal.valueOf(100.0))
                .isActive(true)
                .displayOrder(4)
                .build();
    }

    @Test
    @DisplayName("Lấy tất cả cấu hình chính sách từ cơ sở dữ liệu")
    void testGetAllConfigs_FromDatabase() {
        when(repository.findAllByOrderByDisplayOrderAscMinScoreAsc())
                .thenReturn(List.of(redConfig, fairConfig, goodConfig, excellentConfig));

        List<AiShieldPolicyConfigResponse> list = service.getAllConfigs();

        assertEquals(4, list.size());
        assertEquals(AiShieldTier.RED_ALERT, list.get(0).getTier());
        assertEquals("Báo động đỏ", list.get(0).getLabel());
        assertEquals(BigDecimal.ZERO, list.get(0).getMinScore());
    }

    @Test
    @DisplayName("Lấy tất cả cấu hình khi DB trống thì fallback về danh sách mặc định")
    void testGetAllConfigs_FallbackDefault() {
        when(repository.findAllByOrderByDisplayOrderAscMinScoreAsc()).thenReturn(List.of());

        List<AiShieldPolicyConfigResponse> list = service.getAllConfigs();

        assertEquals(4, list.size());
        assertEquals(AiShieldTier.RED_ALERT, list.get(0).getTier());
        assertEquals(AiShieldTier.EXCELLENT, list.get(3).getTier());
    }

    @Test
    @DisplayName("Cập nhật ngưỡng % và nhãn thành công")
    void testUpdateConfig_Success() {
        when(repository.findByTier(AiShieldTier.RED_ALERT)).thenReturn(Optional.of(redConfig));
        when(repository.save(any(AiShieldPolicyConfig.class))).thenAnswer(i -> i.getArgument(0));

        AiShieldPolicyConfigRequest request = AiShieldPolicyConfigRequest.builder()
                .label("Báo động cực kỳ nghiêm trọng")
                .minScore(BigDecimal.ZERO)
                .maxScore(BigDecimal.valueOf(40.0))
                .build();

        AiShieldPolicyConfigResponse res = service.updateConfig(AiShieldTier.RED_ALERT, request);

        assertNotNull(res);
        assertEquals("Báo động cực kỳ nghiêm trọng", res.getLabel());
        assertEquals(BigDecimal.valueOf(40.0), res.getMaxScore());
        verify(repository, times(1)).save(any(AiShieldPolicyConfig.class));
    }

    @Test
    @DisplayName("Cập nhật khoảng điểm không hợp lệ (min >= max) thì ném AppException")
    void testUpdateConfig_InvalidRange() {
        AiShieldPolicyConfigRequest request = AiShieldPolicyConfigRequest.builder()
                .label("Lỗi")
                .minScore(BigDecimal.valueOf(80.0))
                .maxScore(BigDecimal.valueOf(50.0))
                .build();

        assertThrows(AppException.class, () ->
                service.updateConfig(AiShieldTier.FAIR, request)
        );
    }

    @Test
    @DisplayName("Khôi phục cấu hình phân tầng về mặc định")
    void testResetDefaultConfigs() {
        when(repository.findByTier(any(AiShieldTier.class))).thenReturn(Optional.empty());
        when(repository.save(any(AiShieldPolicyConfig.class))).thenAnswer(i -> i.getArgument(0));
        when(repository.findAllByOrderByDisplayOrderAscMinScoreAsc())
                .thenReturn(List.of(redConfig, fairConfig, goodConfig, excellentConfig));

        List<AiShieldPolicyConfigResponse> resetList = service.resetDefaultConfigs();

        assertNotNull(resetList);
        assertEquals(4, resetList.size());
        verify(repository, times(4)).save(any(AiShieldPolicyConfig.class));
    }

    @Test
    @DisplayName("Phân tầng điểm số động theo cấu hình DB")
    void testResolveTier_FromConfigs() {
        when(repository.findByIsActiveTrueOrderByDisplayOrderAscMinScoreAsc())
                .thenReturn(List.of(redConfig, fairConfig, goodConfig, excellentConfig));

        var evalRed = service.resolveTier(BigDecimal.valueOf(35.0));
        assertEquals(AiShieldTier.RED_ALERT, evalRed.tier());
        assertEquals("Báo động đỏ", evalRed.label());

        var evalFair = service.resolveTier(BigDecimal.valueOf(65.0));
        assertEquals(AiShieldTier.FAIR, evalFair.tier());
        assertEquals("Khá", evalFair.label());

        var evalGood = service.resolveTier(BigDecimal.valueOf(85.0));
        assertEquals(AiShieldTier.GOOD, evalGood.tier());
        assertEquals("Tốt", evalGood.label());

        var evalExcellent = service.resolveTier(BigDecimal.valueOf(95.0));
        assertEquals(AiShieldTier.EXCELLENT, evalExcellent.tier());
        assertEquals("Xuất sắc", evalExcellent.label());
    }

    @Test
    @DisplayName("Phân tầng fallback theo Enum khi DB chưa có cấu hình")
    void testResolveTier_FallbackEnum() {
        when(repository.findByIsActiveTrueOrderByDisplayOrderAscMinScoreAsc()).thenReturn(List.of());

        var eval = service.resolveTier(BigDecimal.valueOf(92.0));
        assertEquals(AiShieldTier.EXCELLENT, eval.tier());
        assertEquals("Xuất sắc", eval.label());
    }
}
