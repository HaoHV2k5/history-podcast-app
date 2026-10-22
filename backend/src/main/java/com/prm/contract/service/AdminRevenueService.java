package com.prm.contract.service;

import com.prm.common.dto.PageResponse;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.response.*;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface AdminRevenueService {

    MilestoneRevenueSummaryResponse getRevenueSummary(Instant startDate, Instant endDate);

    List<MilestoneRevenueChartPointResponse> getRevenueChart(Instant startDate, Instant endDate, String groupBy);

    PageResponse<AdminMilestoneRevenueResponse> getRevenueLedger(
            Long contractId,
            EscrowStatus status,
            ServiceType serviceType,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable
    );

    List<TopRevenueContributorResponse> getTopContributors(String role, int limit);

    byte[] exportRevenueCsv(
            Long contractId,
            EscrowStatus status,
            ServiceType serviceType,
            Instant startDate,
            Instant endDate,
            String search
    );
}
