package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.response.*;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.service.impl.AdminRevenueServiceImpl;
import com.prm.identity.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminRevenueServiceTest {

    @Mock
    private MilestoneRepository milestoneRepository;

    @InjectMocks
    private AdminRevenueServiceImpl adminRevenueService;

    private Instant now;
    private Instant start;
    private Instant end;

    @BeforeEach
    void setUp() {
        now = Instant.parse("2026-10-10T10:00:00Z");
        start = now.minus(30, ChronoUnit.DAYS);
        end = now;
    }

    @Test
    @DisplayName("Summary: Happy path with valid aggregates")
    void getRevenueSummary_happyPath() {
        Object[] aggregate = new Object[]{
                new BigDecimal("50000.00"), // realized
                new BigDecimal("950000.00"), // held
                new BigDecimal("50000.00"), // pending
                new BigDecimal("1000000.00"), // gross
                BigDecimal.ZERO, // refunded
                5L, // totalCount
                2L, // releasedCount
                3L, // heldCount
                0L // refundedCount
        };
        when(milestoneRepository.getRevenueSummaryAggregate(start, end)).thenReturn(aggregate);

        MilestoneRevenueSummaryResponse res = adminRevenueService.getRevenueSummary(start, end);

        assertNotNull(res);
        assertEquals(new BigDecimal("50000.00"), res.getTotalRealizedRevenue());
        assertEquals(new BigDecimal("950000.00"), res.getTotalEscrowHeld());
        assertEquals(new BigDecimal("50000.00"), res.getTotalPendingRevenue());
        assertEquals(new BigDecimal("1000000.00"), res.getTotalGrossVolume());
        assertEquals(5L, res.getTotalMilestonesCount());
        assertEquals(2L, res.getReleasedMilestonesCount());
        assertEquals(3L, res.getHeldMilestonesCount());
        assertEquals(0L, res.getRefundedMilestonesCount());
    }

    @Test
    @DisplayName("Summary: Null repository returns default to ZERO and 0")
    void getRevenueSummary_nullReturnsDefaultToZero() {
        when(milestoneRepository.getRevenueSummaryAggregate(start, end)).thenReturn(null);

        MilestoneRevenueSummaryResponse res = adminRevenueService.getRevenueSummary(start, end);

        assertNotNull(res);
        assertEquals(BigDecimal.ZERO, res.getTotalRealizedRevenue());
        assertEquals(BigDecimal.ZERO, res.getTotalEscrowHeld());
        assertEquals(0L, res.getTotalMilestonesCount());
    }

    @Test
    @DisplayName("Summary: Date range validation fails when startDate > endDate")
    void getRevenueSummary_invalidDateRange() {
        Instant invalidStart = now.plus(1, ChronoUnit.DAYS);
        Instant invalidEnd = now;

        assertThrows(AppException.class, () -> adminRevenueService.getRevenueSummary(invalidStart, invalidEnd));
    }

    @Test
    @DisplayName("Chart: Groups by DAY and splits VOICE vs CONTENT")
    void getRevenueChart_dayGrouping() {
        Contract voiceContract = Contract.builder().id(1L).serviceType(ServiceType.VOICE).build();
        Milestone m1 = Milestone.builder()
                .id(10L)
                .contract(voiceContract)
                .amount(new BigDecimal("1000000"))
                .platformFee(new BigDecimal("50000"))
                .escrowStatus(EscrowStatus.RELEASED)
                .releasedAt(Instant.parse("2026-10-10T02:00:00Z")) // VN time: 2026-10-10
                .build();

        Contract contentContract = Contract.builder().id(2L).serviceType(ServiceType.CONTENT).build();
        Milestone m2 = Milestone.builder()
                .id(20L)
                .contract(contentContract)
                .amount(new BigDecimal("2000000"))
                .platformFee(new BigDecimal("100000"))
                .escrowStatus(EscrowStatus.RELEASED)
                .releasedAt(Instant.parse("2026-10-10T05:00:00Z")) // VN time: 2026-10-10
                .build();

        when(milestoneRepository.findReleasedMilestonesForChart(start, end)).thenReturn(List.of(m1, m2));

        List<MilestoneRevenueChartPointResponse> chart = adminRevenueService.getRevenueChart(start, end, "DAY");

        assertNotNull(chart);
        assertEquals(1, chart.size());
        MilestoneRevenueChartPointResponse point = chart.get(0);
        assertEquals("2026-10-10", point.getTimeBucket());
        assertEquals(new BigDecimal("150000"), point.getRealizedRevenue());
        assertEquals(new BigDecimal("50000"), point.getVoiceRevenue());
        assertEquals(new BigDecimal("100000"), point.getContentRevenue());
        assertEquals(new BigDecimal("3000000"), point.getGrossVolume());
        assertEquals(2L, point.getTransactionCount());
    }

    @Test
    @DisplayName("Chart: Throws exception when groupBy is invalid")
    void getRevenueChart_invalidGroupBy() {
        assertThrows(AppException.class, () -> adminRevenueService.getRevenueChart(start, end, "YEAR"));
    }

    @Test
    @DisplayName("Ledger: Returns page of AdminMilestoneRevenueResponse")
    void getRevenueLedger_happyPath() {
        User creator = User.builder().id(1L).fullName("Creator A").email("creator@test.com").build();
        User freelancer = User.builder().id(2L).fullName("Freelancer B").email("freelancer@test.com").build();
        Contract contract = Contract.builder().id(10L).title("Podcast Ep 1").creator(creator).freelancer(freelancer).serviceType(ServiceType.VOICE).platformFeePercent(new BigDecimal("5.00")).build();
        Milestone milestone = Milestone.builder()
                .id(20L)
                .orderNo(1)
                .title("Milestone 1")
                .contract(contract)
                .amount(new BigDecimal("500000"))
                .platformFee(new BigDecimal("25000"))
                .netAmount(new BigDecimal("475000"))
                .escrowStatus(EscrowStatus.RELEASED)
                .status(MilestoneStatus.RELEASED)
                .fundedAt(now.minus(2, ChronoUnit.DAYS))
                .releasedAt(now)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Milestone> page = new PageImpl<>(List.of(milestone), pageable, 1);

        when(milestoneRepository.findLedgerWithFilters(null, EscrowStatus.RELEASED, ServiceType.VOICE, start, end, null, pageable))
                .thenReturn(page);

        PageResponse<AdminMilestoneRevenueResponse> result = adminRevenueService.getRevenueLedger(
                null, EscrowStatus.RELEASED, ServiceType.VOICE, start, end, null, pageable
        );

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        AdminMilestoneRevenueResponse item = result.getItems().get(0);
        assertEquals(20L, item.getMilestoneId());
        assertEquals("Milestone 1", item.getMilestoneTitle());
        assertEquals(10L, item.getContractId());
        assertEquals("Podcast Ep 1", item.getContractTitle());
        assertEquals("Creator A", item.getCreatorName());
        assertEquals("Freelancer B", item.getFreelancerName());
        assertEquals(new BigDecimal("25000"), item.getPlatformFee());
    }

    @Test
    @DisplayName("Top Contributors: Returns creator and freelancer rankings")
    void getTopContributors_happyPath() {
        Object[] creatorRow = new Object[]{1L, "Creator Boss", "boss@test.com", "http://avatar.png", new BigDecimal("10000000"), new BigDecimal("500000"), 4L};
        when(milestoneRepository.findTopCreators(PageRequest.of(0, 5))).thenReturn(List.<Object[]>of(creatorRow));

        List<TopRevenueContributorResponse> creators = adminRevenueService.getTopContributors("CREATOR", 5);
        assertNotNull(creators);
        assertEquals(1, creators.size());
        assertEquals("Creator Boss", creators.get(0).getFullName());
        assertEquals("CREATOR", creators.get(0).getRole());
        assertEquals(new BigDecimal("500000"), creators.get(0).getTotalPlatformFeeContributed());

        Object[] freelancerRow = new Object[]{2L, "Star Voice", "voice@test.com", null, new BigDecimal("8000000"), new BigDecimal("400000"), 3L};
        when(milestoneRepository.findTopFreelancers(PageRequest.of(0, 5))).thenReturn(List.<Object[]>of(freelancerRow));

        List<TopRevenueContributorResponse> freelancers = adminRevenueService.getTopContributors("FREELANCER", 5);
        assertNotNull(freelancers);
        assertEquals(1, freelancers.size());
        assertEquals("Star Voice", freelancers.get(0).getFullName());
        assertEquals("FREELANCER", freelancers.get(0).getRole());
    }

    @Test
    @DisplayName("Export CSV: Generates UTF-8 BOM with proper columns and escaped text")
    void exportRevenueCsv_happyPath() {
        User creator = User.builder().id(1L).fullName("Nguyễn Văn A, CEO").email("a@test.com").build();
        User freelancer = User.builder().id(2L).fullName("Trần Thị B").email("b@test.com").build();
        Contract contract = Contract.builder().id(10L).title("Thu âm \"Lịch Sử Việt Nam\"").creator(creator).freelancer(freelancer).serviceType(ServiceType.VOICE).platformFeePercent(new BigDecimal("5.00")).build();
        Milestone milestone = Milestone.builder()
                .id(20L)
                .orderNo(1)
                .title("Giai đoạn 1: Demo")
                .contract(contract)
                .amount(new BigDecimal("1000000"))
                .platformFee(new BigDecimal("50000"))
                .netAmount(new BigDecimal("950000"))
                .escrowStatus(EscrowStatus.RELEASED)
                .status(MilestoneStatus.RELEASED)
                .fundedAt(Instant.parse("2026-10-01T08:00:00Z"))
                .releasedAt(Instant.parse("2026-10-05T08:00:00Z"))
                .build();

        Page<Milestone> page = new PageImpl<>(List.of(milestone));
        when(milestoneRepository.findLedgerWithFilters(
                eq(null), eq(null), eq(null), eq(start), eq(end), eq(null), any(Pageable.class)
        )).thenReturn(page);

        byte[] csv = adminRevenueService.exportRevenueCsv(null, null, null, start, end, null);

        assertNotNull(csv);
        String content = new String(csv, StandardCharsets.UTF_8);

        // Check BOM
        assertTrue(content.startsWith("\uFEFF"), "CSV must start with UTF-8 BOM");

        // Check Header
        assertTrue(content.contains("Mã Milestone,Thứ tự,Tiêu đề Milestone,Mã Hợp đồng"));

        // Check escaped fields
        assertTrue(content.contains("\"Nguyễn Văn A, CEO\""));
        assertTrue(content.contains("\"Thu âm \"\"Lịch Sử Việt Nam\"\"\""));
        assertTrue(content.contains("50000"));
        assertTrue(content.contains("950000"));
    }
}
