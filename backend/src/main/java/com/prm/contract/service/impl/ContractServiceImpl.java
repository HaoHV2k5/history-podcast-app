package com.prm.contract.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.constant.EscrowStatus;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.constant.PostStatus;
import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.request.CreateContractRequest;
import com.prm.contract.dto.request.MilestoneItemRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.dto.response.MilestoneResponse;
import com.prm.contract.dto.response.RevisionRequestResponse;
import com.prm.contract.dto.response.SubmissionResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.*;
import com.prm.contract.service.ContractService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final MilestoneRepository milestoneRepository;
    private final SubmissionRepository submissionRepository;
    private final RevisionRequestRepository revisionRequestRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final BookingEscrowProperties properties;

    @Override
    public ContractResponse createAndSendContract(CreateContractRequest request) {
        User creator = getCurrentUser();

        // 1. Kiểm tra vai trò Creator
        if (!creator.hasRole(RoleEnum.CREATOR.name()) && !creator.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.CREATOR_ROLE_REQUIRED, "Chỉ tài khoản Creator (đã xác thực SĐT) mới có quyền tạo hợp đồng");
        }

        // 2. Không được tự thuê chính mình
        if (creator.getId().equals(request.getFreelancerId())) {
            throw new AppException(ErrorCode.CANNOT_CONTRACT_SELF, "Bạn không thể tạo hợp đồng với chính mình");
        }

        // 3. Kiểm tra freelancer hợp lệ
        User freelancer = userRepository.findById(request.getFreelancerId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản Freelancer"));
        if (!freelancer.hasRole(RoleEnum.FREELANCER.name()) && !freelancer.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FREELANCER_ROLE_REQUIRED, "Người nhận hợp đồng chưa kích hoạt vai trò Freelancer");
        }

        // 4. Validate milestones
        List<MilestoneItemRequest> items = request.getMilestones();
        if (items == null || items.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Hợp đồng phải có ít nhất 1 milestone");
        }
        if (items.size() > properties.getMaxMilestones()) {
            throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Số milestone tối đa cho một hợp đồng là " + properties.getMaxMilestones());
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (MilestoneItemRequest item : items) {
            if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Số tiền của từng milestone phải lớn hơn 0");
            }
            if (item.getDurationDays() == null || item.getDurationDays() <= 0) {
                throw new AppException(ErrorCode.INVALID_CONTRACT_DATA, "Số ngày làm việc của milestone phải lớn hơn 0");
            }
            totalAmount = totalAmount.add(item.getAmount());
        }

        Post post = null;
        if (request.getPostId() != null) {
            post = postRepository.findById(request.getPostId()).orElse(null);
            if (post != null) {
                post.setStatus(PostStatus.IN_CONTRACT);
                postRepository.save(post);
            }
        }

        // Tính toán phí nền tảng cấp Hợp đồng (Admin config cứng)
        BigDecimal feePercent = properties.getPlatformFeePercent() != null ? properties.getPlatformFeePercent() : new BigDecimal("5.0");
        BigDecimal platformFee = totalAmount.multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal netAmount = totalAmount.subtract(platformFee);

        Instant acceptDueAt = Instant.now().plus(properties.getContractAcceptHours(), ChronoUnit.HOURS);
        String standardTerms = generateStandardTerms(feePercent);

        Contract contract = Contract.builder()
                .post(post)
                .creator(creator)
                .freelancer(freelancer)
                .serviceType(request.getServiceType())
                .title(request.getTitle())
                .description(request.getDescription())
                .totalAmount(totalAmount)
                .platformFeePercent(feePercent)
                .platformFee(platformFee)
                .netAmount(netAmount)
                .termsText(standardTerms)
                .status(ContractStatus.PENDING)
                .acceptDueAt(acceptDueAt)
                .createdAt(Instant.now())
                .build();

        Contract savedContract = contractRepository.save(contract);

        // Lưu các milestones: Mỗi milestone tự khấu trừ phí nền tảng cuốn chiếu theo tỷ lệ feePercent
        List<Milestone> milestones = new ArrayList<>();
        BigDecimal accumulatedFee = BigDecimal.ZERO;
        for (int i = 0; i < items.size(); i++) {
            MilestoneItemRequest item = items.get(i);
            int maxRev = item.getMaxRevisions() != null ? item.getMaxRevisions() : properties.getMaxRevisionsDefault();
            int revDays = (item.getRevisionDays() != null && item.getRevisionDays() > 0)
                    ? item.getRevisionDays()
                    : properties.getRevisionDays();
            boolean isLast = (i == items.size() - 1);

            BigDecimal mFee;
            if (isLast) {
                mFee = platformFee.subtract(accumulatedFee);
            } else {
                mFee = item.getAmount().multiply(feePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                accumulatedFee = accumulatedFee.add(mFee);
            }
            BigDecimal mNet = item.getAmount().subtract(mFee);

            Milestone m = Milestone.builder()
                    .contract(savedContract)
                    .orderNo(i + 1)
                    .title(item.getTitle())
                    .requirement(item.getRequirement())
                    .amount(item.getAmount())
                    .platformFee(mFee)
                    .netAmount(mNet)
                    .durationDays(item.getDurationDays())
                    .maxRevisions(maxRev)
                    .revisionsUsed(0)
                    .revisionDays(revDays)
                    .status(MilestoneStatus.WAITING)
                    .build();
            milestones.add(milestoneRepository.save(m));
        }

        savedContract.setMilestones(milestones);
        log.info("Contract {} created by creator {} for freelancer {}, acceptDueAt {}",
                savedContract.getId(), creator.getEmail(), freelancer.getEmail(), acceptDueAt);

        return toContractResponse(savedContract);
    }

    @Override
    public ContractResponse acceptContract(Long contractId) {
        User currentUser = getCurrentUser();
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy hợp đồng"));

        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Freelancer nhận hợp đồng mới có quyền chấp nhận");
        }

        if (contract.getStatus() != ContractStatus.PENDING) {
            throw new AppException(ErrorCode.CONTRACT_INVALID_STATE, "Hợp đồng không ở trạng thái chờ chấp thuận: " + contract.getStatus());
        }

        if (contract.getAcceptDueAt() != null && Instant.now().isAfter(contract.getAcceptDueAt())) {
            contract.setStatus(ContractStatus.REJECTED);
            if (contract.getPost() != null) {
                contract.getPost().setStatus(PostStatus.OPEN);
                postRepository.save(contract.getPost());
            }
            contractRepository.save(contract);
            throw new AppException(ErrorCode.CONTRACT_INVALID_STATE, "Hợp đồng đã quá hạn 48h để chấp nhận");
        }

        contract.setStatus(ContractStatus.ACTIVE);
        contract.setAcceptedAt(Instant.now());
        Contract savedContract = contractRepository.save(contract);

        // Kích hoạt Milestone 1 sang UNFUNDED
        Optional<Milestone> m1Opt = milestoneRepository.findByContractIdAndOrderNo(contract.getId(), 1);
        if (m1Opt.isPresent()) {
            Milestone m1 = m1Opt.get();
            m1.setStatus(MilestoneStatus.UNFUNDED);
            m1.setFundDueAt(Instant.now().plus(properties.getFundHours(), ChronoUnit.HOURS));
            milestoneRepository.save(m1);
            log.info("Milestone #1 of contract {} set to UNFUNDED, fundDueAt {}", contractId, m1.getFundDueAt());
        }

        log.info("Contract {} accepted by freelancer {}", contractId, currentUser.getEmail());
        return toContractResponse(savedContract);
    }

    @Override
    public ContractResponse rejectContract(Long contractId) {
        User currentUser = getCurrentUser();
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy hợp đồng"));

        if (!contract.getFreelancer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Freelancer nhận hợp đồng mới có quyền từ chối");
        }

        if (contract.getStatus() != ContractStatus.PENDING) {
            throw new AppException(ErrorCode.CONTRACT_INVALID_STATE, "Hợp đồng không ở trạng thái chờ chấp thuận: " + contract.getStatus());
        }

        contract.setStatus(ContractStatus.REJECTED);
        if (contract.getPost() != null) {
            contract.getPost().setStatus(PostStatus.OPEN);
            postRepository.save(contract.getPost());
        }

        Contract saved = contractRepository.save(contract);
        log.info("Contract {} rejected by freelancer {}", contractId, currentUser.getEmail());
        return toContractResponse(saved);
    }

    @Override
    public ContractResponse cancelContract(Long contractId) {
        User currentUser = getCurrentUser();
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy hợp đồng"));

        boolean isMember = contract.getCreator().getId().equals(currentUser.getId()) ||
                           contract.getFreelancer().getId().equals(currentUser.getId()) ||
                           currentUser.hasRole("ADMIN");
        if (!isMember) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Bạn không có quyền thao tác trên hợp đồng này");
        }

        // Nếu hợp đồng đang PENDING, Creator có quyền hủy trước khi Freelancer accept
        if (contract.getStatus() == ContractStatus.PENDING) {
            contract.setStatus(ContractStatus.CANCELLED);
            if (contract.getPost() != null) {
                contract.getPost().setStatus(PostStatus.OPEN);
                postRepository.save(contract.getPost());
            }
            Contract saved = contractRepository.save(contract);
            log.info("Contract {} cancelled while PENDING by user {}", contractId, currentUser.getEmail());
            return toContractResponse(saved);
        }

        throw new AppException(ErrorCode.CONTRACT_INVALID_STATE,
                "Hợp đồng đã ACTIVE chỉ có thể bị hủy thông qua hủy milestone hoặc xử lý tranh chấp (Dispute)");
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractById(Long id) {
        User currentUser = getCurrentUser();
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CONTRACT_NOT_FOUND, "Không tìm thấy hợp đồng"));

        boolean isMember = contract.getCreator().getId().equals(currentUser.getId()) ||
                           contract.getFreelancer().getId().equals(currentUser.getId()) ||
                           currentUser.hasRole("ADMIN");
        if (!isMember) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Bạn không thuộc thành viên của hợp đồng này");
        }

        return toContractResponse(contract);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ContractResponse> getMyContracts(ContractStatus status, Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Contract> page = contractRepository.findMyContracts(currentUser.getId(), status, pageable);
        List<ContractResponse> content = page.getContent().stream()
                .map(this::toContractResponse)
                .toList();
        return PageResponse.of(page, content);
    }

    // --- Legacy CRUD implementations ---
    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> findAll() {
        return contractRepository.findAll().stream().map(this::toContractResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse findById(Long id) {
        return getContractById(id);
    }

    @Override
    public ContractResponse create(ContractRequest request) {
        // Fallback for legacy controller
        throw new UnsupportedOperationException("Vui lòng sử dụng API createAndSendContract");
    }

    @Override
    public ContractResponse update(Long id, ContractRequest request) {
        throw new UnsupportedOperationException("Không được sửa hợp đồng trực tiếp");
    }

    @Override
    public void delete(Long id) {
        cancelContract(id);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }

    private ContractResponse toContractResponse(Contract c) {
        List<MilestoneResponse> milestoneResponses = milestoneRepository.findByContractIdOrderByOrderNoAsc(c.getId()).stream()
                .map(this::toMilestoneResponse)
                .toList();

        return ContractResponse.builder()
                .id(c.getId())
                .postId(c.getPost() != null ? c.getPost().getId() : null)
                .postTitle(c.getPost() != null ? c.getPost().getTitle() : null)
                .creatorId(c.getCreator() != null ? c.getCreator().getId() : null)
                .creatorFullName(c.getCreator() != null ? c.getCreator().getFullName() : null)
                .creatorAvatarUrl(c.getCreator() != null ? c.getCreator().getAvatarUrl() : null)
                .freelancerId(c.getFreelancer() != null ? c.getFreelancer().getId() : null)
                .freelancerFullName(c.getFreelancer() != null ? c.getFreelancer().getFullName() : null)
                .freelancerAvatarUrl(c.getFreelancer() != null ? c.getFreelancer().getAvatarUrl() : null)
                .serviceType(c.getServiceType())
                .title(c.getTitle())
                .description(c.getDescription())
                .totalAmount(c.getTotalAmount())
                .platformFeePercent(c.getPlatformFeePercent())
                .platformFee(c.getPlatformFee())
                .netAmount(c.getNetAmount())
                .termsText(c.getTermsText())
                .status(c.getStatus())
                .acceptedAt(c.getAcceptedAt())
                .acceptDueAt(c.getAcceptDueAt())
                .milestones(milestoneResponses)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MilestoneResponse toMilestoneResponse(Milestone m) {
        EscrowStatus escrowStatus = m.getEscrowStatus();

        List<SubmissionResponse> submissions = submissionRepository.findByMilestoneIdOrderByVersionNoDesc(m.getId()).stream()
                .map(s -> SubmissionResponse.builder()
                        .id(s.getId())
                        .milestoneId(m.getId())
                        .versionNo(s.getVersionNo())
                        .content(s.getContent())
                        .fileUrl(s.getFileUrl())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();

        List<RevisionRequestResponse> revisions = revisionRequestRepository.findByMilestoneIdOrderByCreatedAtDesc(m.getId()).stream()
                .map(r -> RevisionRequestResponse.builder()
                        .id(r.getId())
                        .milestoneId(m.getId())
                        .submissionId(r.getSubmission() != null ? r.getSubmission().getId() : null)
                        .note(r.getNote())
                        .createdAt(r.getCreatedAt())
                        .build())
                .toList();

        return MilestoneResponse.builder()
                .id(m.getId())
                .contractId(m.getContract().getId())
                .orderNo(m.getOrderNo())
                .title(m.getTitle())
                .requirement(m.getRequirement())
                .amount(m.getAmount())
                .durationDays(m.getDurationDays())
                .maxRevisions(m.getMaxRevisions())
                .revisionsUsed(m.getRevisionsUsed())
                .revisionDays(m.getRevisionDays())
                .status(m.getStatus())
                .fundDueAt(m.getFundDueAt())
                .dueAt(m.getDueAt())
                .reviewDueAt(m.getReviewDueAt())
                .releaseAt(m.getReleaseAt())
                .escrowStatus(escrowStatus)
                .platformFee(m.getPlatformFee())
                .netAmount(m.getNetAmount())
                .fundedAt(m.getFundedAt())
                .releasedAt(m.getReleasedAt())
                .refundedAt(m.getRefundedAt())
                .submissions(submissions)
                .revisionRequests(revisions)
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private String generateStandardTerms(BigDecimal feePercent) {
        int reviewDays = properties.getReviewDays();
        int releaseHoldDays = properties.getReleaseHoldDays();
        int maxRevisions = properties.getMaxRevisionsDefault();

        String template = properties.getTermsTemplate();
        if (template == null || template.isBlank()) {
            template = BookingEscrowProperties.DEFAULT_TERMS_TEMPLATE;
        }

        return template
                .replace("{feePercent}", feePercent + "%")
                .replace("{reviewDays}", reviewDays + " ngày")
                .replace("{releaseHoldDays}", releaseHoldDays + " ngày")
                .replace("{maxRevisions}", maxRevisions + " lần");
    }
}
