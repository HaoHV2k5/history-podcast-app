package com.prm.contract.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.DisputeResult;
import com.prm.contract.constant.DisputeStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.request.CounterEvidenceRequest;
import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.request.OpenDisputeRequest;
import com.prm.contract.dto.request.ResolveDisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Dispute;
import com.prm.contract.entity.Milestone;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.repository.DisputeRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.service.DisputeService;
import com.prm.contract.service.EscrowService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DisputeServiceImpl implements DisputeService {

    private final DisputeRepository disputeRepository;
    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final EscrowService escrowService;
    private final BookingEscrowProperties properties;

    @Override
    public DisputeResponse openDispute(OpenDisputeRequest request) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(request.getMilestoneId())
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        boolean isMember = contract.getCreator().getId().equals(currentUser.getId()) ||
                           contract.getFreelancer().getId().equals(currentUser.getId());
        if (!isMember) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ thành viên hợp đồng mới có quyền khiếu nại (Report)");
        }

        // Kiểm tra trạng thái milestone cho phép mở dispute
        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS &&
            milestone.getStatus() != MilestoneStatus.SUBMITTED &&
            milestone.getStatus() != MilestoneStatus.APPROVED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE,
                    "Không thể mở khiếu nại khi milestone ở trạng thái: " + milestone.getStatus());
        }

        if (disputeRepository.existsByMilestoneIdAndStatus(milestone.getId(), DisputeStatus.OPEN)) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_EXISTS, "Milestone này hiện đang có tranh chấp chờ Admin giải quyết");
        }

        // 1. Đóng băng khoản tiền ký quỹ (FROZEN)
        escrowService.freezeEscrow(milestone.getId());

        // 2. Chuyển trạng thái milestone sang DISPUTED
        milestone.setStatus(MilestoneStatus.DISPUTED);
        milestoneRepository.save(milestone);

        // 3. Tạo bản ghi tranh chấp
        Dispute dispute = Dispute.builder()
                .contract(contract)
                .milestone(milestone)
                .raisedByUser(currentUser)
                .reason(request.getReason())
                .evidence(request.getEvidence())
                .status(DisputeStatus.OPEN)
                .createdAt(Instant.now())
                .build();

        Dispute saved = disputeRepository.save(dispute);
        log.info("Dispute {} opened for milestone {} by user {}", saved.getId(), milestone.getId(), currentUser.getEmail());
        return toDisputeResponse(saved);
    }

    @Override
    public DisputeResponse submitCounterEvidence(Long disputeId, CounterEvidenceRequest request) {
        User currentUser = getCurrentUser();
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND, "Không tìm thấy tranh chấp"));

        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new AppException(ErrorCode.DISPUTE_INVALID_STATE, "Tranh chấp này đã được phân xử hoặc đóng");
        }

        dispute.setCounterEvidence(request.getCounterEvidence());
        dispute.setUpdatedAt(Instant.now());
        Dispute updated = disputeRepository.save(dispute);

        log.info("Counter evidence submitted for dispute {} by user {}", disputeId, currentUser.getEmail());
        return toDisputeResponse(updated);
    }

    @Override
    public DisputeResponse resolveDispute(Long disputeId, ResolveDisputeRequest request) {
        User admin = getCurrentUser();
        if (!admin.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Quản trị viên (Admin) mới có quyền phân xử tranh chấp");
        }

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND, "Không tìm thấy tranh chấp"));

        if (dispute.getStatus() != DisputeStatus.OPEN) {
            throw new AppException(ErrorCode.DISPUTE_INVALID_STATE, "Tranh chấp này đã được phân xử trước đó");
        }

        Milestone milestone = dispute.getMilestone();
        Contract contract = dispute.getContract();

        // Xử lý tiền ký quỹ và trạng thái milestone/contract theo kết quả phân xử
        if (request.getResult() == DisputeResult.RELEASE_TO_FREELANCER) {
            escrowService.releaseMilestoneEscrow(milestone.getId());
            milestone.setStatus(MilestoneStatus.RELEASED);
            milestoneRepository.save(milestone);

            // Mở milestone kế tiếp nếu có
            activateNextMilestoneIfWaiting(contract, milestone);
        } else if (request.getResult() == DisputeResult.REFUND_TO_CREATOR) {
            escrowService.refundMilestoneEscrow(milestone.getId(), "Admin quyết định hoàn tiền 100% cho Creator: " + request.getResolution());
            milestone.setStatus(MilestoneStatus.CANCELLED);
            milestoneRepository.save(milestone);

            contract.setStatus(ContractStatus.CANCELLED);
            contractRepository.save(contract);
        } else if (request.getResult() == DisputeResult.SPLIT) {
            escrowService.splitMilestoneEscrow(milestone.getId(), request.getSplitPercent(), "Admin phân xử chia tỉ lệ: " + request.getResolution());
            milestone.setStatus(MilestoneStatus.RELEASED);
            milestoneRepository.save(milestone);

            activateNextMilestoneIfWaiting(contract, milestone);
        }

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResult(request.getResult());
        dispute.setSplitPercent(request.getSplitPercent());
        dispute.setResolution(request.getResolution());
        dispute.setResolvedByUser(admin);
        dispute.setResolvedAt(Instant.now());
        Dispute saved = disputeRepository.save(dispute);

        log.info("Dispute {} resolved by admin {} with result {}", disputeId, admin.getEmail(), request.getResult());
        return toDisputeResponse(saved);
    }

    private void activateNextMilestoneIfWaiting(Contract contract, Milestone currentMilestone) {
        Optional<Milestone> nextMilestoneOpt = milestoneRepository.findByContractIdAndOrderNo(contract.getId(), currentMilestone.getOrderNo() + 1);
        if (nextMilestoneOpt.isPresent()) {
            Milestone nextMilestone = nextMilestoneOpt.get();
            if (nextMilestone.getStatus() == MilestoneStatus.WAITING) {
                nextMilestone.setStatus(MilestoneStatus.UNFUNDED);
                nextMilestone.setFundDueAt(Instant.now().plus(properties.getFundHours(), ChronoUnit.HOURS));
                milestoneRepository.save(nextMilestone);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeResponse getDisputeById(Long id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND, "Không tìm thấy tranh chấp"));
        return toDisputeResponse(dispute);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> getDisputesByContract(Long contractId) {
        return disputeRepository.findByContractId(contractId).stream()
                .map(this::toDisputeResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DisputeResponse> getAllDisputes(DisputeStatus status, Pageable pageable) {
        Page<Dispute> page = (status != null)
                ? disputeRepository.findByStatus(status, pageable)
                : disputeRepository.findAll(pageable);
        List<DisputeResponse> content = page.getContent().stream()
                .map(this::toDisputeResponse)
                .toList();
        return PageResponse.of(page, content);
    }

    // --- Legacy methods for backward compatibility ---
    @Override
    @Transactional(readOnly = true)
    public List<DisputeResponse> findAll() {
        return disputeRepository.findAll().stream().map(this::toDisputeResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DisputeResponse findById(Long id) {
        return getDisputeById(id);
    }

    @Override
    public DisputeResponse create(DisputeRequest request) {
        throw new UnsupportedOperationException("Vui lòng sử dụng API openDispute");
    }

    @Override
    public DisputeResponse update(Long id, DisputeRequest request) {
        throw new UnsupportedOperationException("Vui lòng sử dụng API resolveDispute hoặc submitCounterEvidence");
    }

    @Override
    public void delete(Long id) {
        disputeRepository.deleteById(id);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }

    private DisputeResponse toDisputeResponse(Dispute d) {
        return DisputeResponse.builder()
                .id(d.getId())
                .contractId(d.getContract().getId())
                .contractTitle(d.getContract().getTitle())
                .milestoneId(d.getMilestone() != null ? d.getMilestone().getId() : null)
                .milestoneTitle(d.getMilestone() != null ? d.getMilestone().getTitle() : null)
                .raisedByUserId(d.getRaisedByUser().getId())
                .raisedByUserFullName(d.getRaisedByUser().getFullName())
                .reason(d.getReason())
                .evidence(d.getEvidence())
                .counterEvidence(d.getCounterEvidence())
                .status(d.getStatus())
                .result(d.getResult())
                .splitPercent(d.getSplitPercent())
                .resolvedByUserId(d.getResolvedByUser() != null ? d.getResolvedByUser().getId() : null)
                .resolvedByUserFullName(d.getResolvedByUser() != null ? d.getResolvedByUser().getFullName() : null)
                .resolution(d.getResolution())
                .resolvedAt(d.getResolvedAt())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
