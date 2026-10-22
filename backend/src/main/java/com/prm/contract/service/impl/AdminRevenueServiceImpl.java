package com.prm.contract.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.response.*;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.service.AdminRevenueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.IsoFields;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminRevenueServiceImpl implements AdminRevenueService {

    private final MilestoneRepository milestoneRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Override
    public MilestoneRevenueSummaryResponse getRevenueSummary(Instant startDate, Instant endDate) {
        validateDateRange(startDate, endDate);

        Instant effStart = getEffectiveStartDate(startDate);
        Instant effEnd = getEffectiveEndDate(endDate);

        Object[] agg = milestoneRepository.getRevenueSummaryAggregate(effStart, effEnd);
        if (agg != null && agg.length == 1 && agg[0] instanceof Object[] nested) {
            agg = nested;
        }

        BigDecimal realized = toBigDecimal(agg != null && agg.length > 0 ? agg[0] : null);
        BigDecimal held = toBigDecimal(agg != null && agg.length > 1 ? agg[1] : null);
        BigDecimal pending = toBigDecimal(agg != null && agg.length > 2 ? agg[2] : null);
        BigDecimal gross = toBigDecimal(agg != null && agg.length > 3 ? agg[3] : null);
        BigDecimal refunded = toBigDecimal(agg != null && agg.length > 4 ? agg[4] : null);

        Long totalCount = agg != null && agg.length > 5 && agg[5] != null ? ((Number) agg[5]).longValue() : 0L;
        Long releasedCount = agg != null && agg.length > 6 && agg[6] != null ? ((Number) agg[6]).longValue() : 0L;
        Long heldCount = agg != null && agg.length > 7 && agg[7] != null ? ((Number) agg[7]).longValue() : 0L;
        Long refundedCount = agg != null && agg.length > 8 && agg[8] != null ? ((Number) agg[8]).longValue() : 0L;

        return MilestoneRevenueSummaryResponse.builder()
                .totalRealizedRevenue(realized)
                .totalEscrowHeld(held)
                .totalPendingRevenue(pending)
                .totalGrossVolume(gross)
                .totalRefundedVolume(refunded)
                .totalMilestonesCount(totalCount)
                .releasedMilestonesCount(releasedCount)
                .heldMilestonesCount(heldCount)
                .refundedMilestonesCount(refundedCount)
                .startDate(startDate)
                .endDate(endDate)
                .build();
    }

    @Override
    public List<MilestoneRevenueChartPointResponse> getRevenueChart(Instant startDate, Instant endDate, String groupBy) {
        validateDateRange(startDate, endDate);

        String group = (groupBy == null || groupBy.isBlank()) ? "DAY" : groupBy.trim().toUpperCase();
        if (!List.of("DAY", "WEEK", "MONTH").contains(group)) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Tham số groupBy chỉ chấp nhận DAY, WEEK hoặc MONTH");
        }

        Instant effStart = getEffectiveStartDate(startDate);
        Instant effEnd = getEffectiveEndDate(endDate);

        List<Milestone> milestones = milestoneRepository.findReleasedMilestonesForChart(effStart, effEnd);
        if (milestones.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<Milestone>> buckets = new TreeMap<>();
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");

        for (Milestone m : milestones) {
            if (m.getReleasedAt() == null) continue;
            LocalDate date = m.getReleasedAt().atZone(zone).toLocalDate();
            String bucketKey = switch (group) {
                case "WEEK" -> date.getYear() + "-W" + String.format("%02d", date.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                case "MONTH" -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                default -> date.format(DateTimeFormatter.ISO_LOCAL_DATE);
            };
            buckets.computeIfAbsent(bucketKey, k -> new ArrayList<>()).add(m);
        }

        List<MilestoneRevenueChartPointResponse> result = new ArrayList<>();
        for (Map.Entry<String, List<Milestone>> entry : buckets.entrySet()) {
            String bucket = entry.getKey();
            List<Milestone> list = entry.getValue();

            BigDecimal realizedRevenue = BigDecimal.ZERO;
            BigDecimal voiceRevenue = BigDecimal.ZERO;
            BigDecimal contentRevenue = BigDecimal.ZERO;
            BigDecimal grossVolume = BigDecimal.ZERO;

            for (Milestone m : list) {
                BigDecimal fee = m.getPlatformFee() != null ? m.getPlatformFee() : BigDecimal.ZERO;
                BigDecimal amt = m.getAmount() != null ? m.getAmount() : BigDecimal.ZERO;

                realizedRevenue = realizedRevenue.add(fee);
                grossVolume = grossVolume.add(amt);

                ServiceType st = (m.getContract() != null) ? m.getContract().getServiceType() : null;
                if (st == ServiceType.VOICE) {
                    voiceRevenue = voiceRevenue.add(fee);
                } else if (st == ServiceType.CONTENT) {
                    contentRevenue = contentRevenue.add(fee);
                }
            }

            result.add(MilestoneRevenueChartPointResponse.builder()
                    .timeBucket(bucket)
                    .realizedRevenue(realizedRevenue)
                    .voiceRevenue(voiceRevenue)
                    .contentRevenue(contentRevenue)
                    .grossVolume(grossVolume)
                    .transactionCount((long) list.size())
                    .build());
        }

        return result;
    }

    @Override
    public PageResponse<AdminMilestoneRevenueResponse> getRevenueLedger(
            Long contractId,
            EscrowStatus status,
            ServiceType serviceType,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable
    ) {
        validateDateRange(startDate, endDate);

        Instant effStart = getEffectiveStartDate(startDate);
        Instant effEnd = getEffectiveEndDate(endDate);

        Page<Milestone> page = milestoneRepository.findLedgerWithFilters(
                contractId,
                status,
                serviceType,
                effStart,
                effEnd,
                search,
                pageable
        );

        List<AdminMilestoneRevenueResponse> items = page.getContent().stream()
                .map(this::toAdminMilestoneRevenueResponse)
                .toList();

        return PageResponse.of(page, items);
    }

    @Override
    public List<TopRevenueContributorResponse> getTopContributors(String role, int limit) {
        int validLimit = limit <= 0 ? 5 : Math.min(limit, 100);
        Pageable pageable = PageRequest.of(0, validLimit);

        boolean isFreelancer = "FREELANCER".equalsIgnoreCase(role);
        List<Object[]> rows = isFreelancer
                ? milestoneRepository.findTopFreelancers(pageable)
                : milestoneRepository.findTopCreators(pageable);

        List<TopRevenueContributorResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            Long userId = ((Number) row[0]).longValue();
            String fullName = (String) row[1];
            String email = (String) row[2];
            String avatarUrl = (String) row[3];
            BigDecimal totalAmount = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;
            BigDecimal feeContributed = row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO;
            Long count = row[6] != null ? ((Number) row[6]).longValue() : 0L;

            result.add(TopRevenueContributorResponse.builder()
                    .userId(userId)
                    .fullName(fullName)
                    .email(email)
                    .avatarUrl(avatarUrl)
                    .role(isFreelancer ? "FREELANCER" : "CREATOR")
                    .totalAmount(totalAmount)
                    .totalPlatformFeeContributed(feeContributed)
                    .milestonesCount(count)
                    .build());
        }

        return result;
    }

    @Override
    public byte[] exportRevenueCsv(
            Long contractId,
            EscrowStatus status,
            ServiceType serviceType,
            Instant startDate,
            Instant endDate,
            String search
    ) {
        validateDateRange(startDate, endDate);

        Instant effStart = getEffectiveStartDate(startDate);
        Instant effEnd = getEffectiveEndDate(endDate);

        Pageable exportPageable = PageRequest.of(0, 10000, Sort.by(Sort.Order.desc("releasedAt").nullsLast(), Sort.Order.desc("createdAt")));
        List<Milestone> list = milestoneRepository.findLedgerWithFilters(
                contractId,
                status,
                serviceType,
                effStart,
                effEnd,
                search,
                exportPageable
        ).getContent();

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM for Microsoft Excel compatibility
        sb.append('\uFEFF');

        // CSV Header
        sb.append("Mã Milestone,Thứ tự,Tiêu đề Milestone,Mã Hợp đồng,Tên Hợp đồng,Loại Dịch vụ,Tên Creator,Email Creator,Tên Freelancer,Email Freelancer,Tổng Tiền (VNĐ),Phí Sàn (%),Doanh Thu Sàn (VNĐ),Thực Nhận Freelancer (VNĐ),Trạng Thái,Ngày Ký Quỹ,Ngày Giải Ngân\n");

        for (Milestone m : list) {
            Contract c = m.getContract();
            BigDecimal feePercent = (c != null && c.getPlatformFeePercent() != null)
                    ? c.getPlatformFeePercent()
                    : BigDecimal.valueOf(5.0);

            sb.append(m.getId() != null ? m.getId() : "").append(",");
            sb.append(m.getOrderNo() != null ? m.getOrderNo() : "").append(",");
            sb.append(escapeCsv(m.getTitle())).append(",");
            sb.append(c != null ? c.getId() : "").append(",");
            sb.append(escapeCsv(c != null ? c.getTitle() : "")).append(",");
            sb.append(c != null && c.getServiceType() != null ? c.getServiceType().name() : "").append(",");

            sb.append(escapeCsv(c != null && c.getCreator() != null ? c.getCreator().getFullName() : "")).append(",");
            sb.append(escapeCsv(c != null && c.getCreator() != null ? c.getCreator().getEmail() : "")).append(",");
            sb.append(escapeCsv(c != null && c.getFreelancer() != null ? c.getFreelancer().getFullName() : "")).append(",");
            sb.append(escapeCsv(c != null && c.getFreelancer() != null ? c.getFreelancer().getEmail() : "")).append(",");

            sb.append(m.getAmount() != null ? m.getAmount().toPlainString() : "0").append(",");
            sb.append(feePercent.toPlainString()).append(",");
            sb.append(m.getPlatformFee() != null ? m.getPlatformFee().toPlainString() : "0").append(",");
            sb.append(m.getNetAmount() != null ? m.getNetAmount().toPlainString() : "0").append(",");
            sb.append(m.getEscrowStatus() != null ? m.getEscrowStatus().name() : "").append(",");

            sb.append(formatInstant(m.getFundedAt())).append(",");
            sb.append(formatInstant(m.getReleasedAt())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private AdminMilestoneRevenueResponse toAdminMilestoneRevenueResponse(Milestone m) {
        Contract c = m.getContract();
        BigDecimal feePercent = (c != null && c.getPlatformFeePercent() != null)
                ? c.getPlatformFeePercent()
                : BigDecimal.valueOf(5.0);

        return AdminMilestoneRevenueResponse.builder()
                .milestoneId(m.getId())
                .milestoneOrderNo(m.getOrderNo())
                .milestoneTitle(m.getTitle())
                .contractId(c != null ? c.getId() : null)
                .contractTitle(c != null ? c.getTitle() : null)
                .serviceType(c != null ? c.getServiceType() : null)
                .creatorId(c != null && c.getCreator() != null ? c.getCreator().getId() : null)
                .creatorName(c != null && c.getCreator() != null ? c.getCreator().getFullName() : null)
                .creatorEmail(c != null && c.getCreator() != null ? c.getCreator().getEmail() : null)
                .freelancerId(c != null && c.getFreelancer() != null ? c.getFreelancer().getId() : null)
                .freelancerName(c != null && c.getFreelancer() != null ? c.getFreelancer().getFullName() : null)
                .freelancerEmail(c != null && c.getFreelancer() != null ? c.getFreelancer().getEmail() : null)
                .grossAmount(m.getAmount())
                .feePercent(feePercent)
                .platformFee(m.getPlatformFee())
                .netAmount(m.getNetAmount())
                .status(m.getEscrowStatus())
                .fundedAt(m.getFundedAt())
                .releasedAt(m.getReleasedAt())
                .refundedAt(m.getRefundedAt())
                .build();
    }

    private void validateDateRange(Instant startDate, Instant endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "startDate không được lớn hơn endDate");
        }
    }

    private Instant getEffectiveStartDate(Instant startDate) {
        return startDate != null ? startDate : Instant.parse("1970-01-01T00:00:00Z");
    }

    private Instant getEffectiveEndDate(Instant endDate) {
        return endDate != null ? endDate : Instant.parse("2099-12-31T23:59:59Z");
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        String escaped = input.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private String formatInstant(Instant instant) {
        if (instant == null) return "";
        return DATE_FORMATTER.format(instant);
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof BigDecimal bd) return bd;
        if (obj instanceof Number num) return BigDecimal.valueOf(num.doubleValue());
        if (obj instanceof Object[] arr) {
            return arr.length > 0 ? toBigDecimal(arr[0]) : BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(obj.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
