package com.prm.contract.service;

import com.prm.contract.dto.response.EscrowPaymentResponse;

import java.math.BigDecimal;

public interface EscrowService {

    EscrowPaymentResponse releaseMilestoneEscrow(Long milestoneId);

    EscrowPaymentResponse refundMilestoneEscrow(Long milestoneId, String reason);

    EscrowPaymentResponse splitMilestoneEscrow(Long milestoneId, BigDecimal freelancerPercent, String reason);

    EscrowPaymentResponse freezeEscrow(Long milestoneId);

    EscrowPaymentResponse getEscrowByMilestoneId(Long milestoneId);
}
