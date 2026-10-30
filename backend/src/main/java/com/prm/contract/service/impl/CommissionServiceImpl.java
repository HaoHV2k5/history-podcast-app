package com.prm.contract.service.impl;

import com.prm.channel.entity.Channel;
import com.prm.channel.repository.ChannelRepository;
import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.constant.CommissionContentType;
import com.prm.contract.constant.CommissionStatus;
import com.prm.contract.constant.ContractStatus;
import com.prm.contract.dto.request.CreateCommissionRequest;
import com.prm.contract.dto.request.RejectCommissionRequest;
import com.prm.contract.dto.response.CommissionResponse;
import com.prm.contract.entity.Commission;
import com.prm.contract.entity.Contract;
import com.prm.contract.repository.CommissionRepository;
import com.prm.contract.repository.ContractRepository;
import com.prm.contract.service.CommissionService;
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
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CommissionServiceImpl implements CommissionService {

    private static final List<String> ACTIVE_REQUEST_STATUSES = List.of(
            CommissionStatus.PENDING.name(),
            CommissionStatus.ACCEPTED.name(),
            CommissionStatus.CONTRACT_SENT.name()
    );

    private static final List<ContractStatus> ACTIVE_CONTRACT_STATUSES = List.of(
            ContractStatus.PENDING,
            ContractStatus.ACTIVE
    );

    private final CommissionRepository repository;
    private final ContractRepository contractRepository;
    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;

    @Override
    public CommissionResponse create(CreateCommissionRequest request) {
        User requester = getCurrentUser();

        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Mô tả chi tiết yêu cầu đặt nội dung không được để trống");
        }

        String normalizedTitle = (request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle().trim()
                : request.getDescription().trim().substring(0, Math.min(100, request.getDescription().trim().length()));

        String normalizedContentType = normalizeAndValidateContentType(request.getContentType());

        // 1. Xác định Kênh và Creator nhận yêu cầu
        Channel targetChannel = null;
        User targetCreator = null;

        if (request.getChannelId() != null) {
            targetChannel = channelRepository.findById(request.getChannelId())
                    .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh Podcast với ID: " + request.getChannelId()));
            targetCreator = targetChannel.getCreator();
        } else if (request.getCreatorId() != null) {
            targetCreator = userRepository.findById(request.getCreatorId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy tài khoản Creator với ID: " + request.getCreatorId()));
            targetChannel = channelRepository.findByCreatorId(targetCreator.getId()).orElse(null);
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng chọn kênh Podcast (channelId) hoặc nhà sáng tạo (creatorId) muốn đặt làm nội dung");
        }

        if (targetCreator == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy chủ sở hữu kênh Podcast");
        }

        // 2. Chặn tự đặt hàng kênh của chính mình
        if (targetCreator.getId().equals(requester.getId())) {
            throw new AppException(ErrorCode.CANNOT_CONTRACT_SELF, "Bạn không thể tự gửi yêu cầu đặt làm nội dung cho kênh của chính mình");
        }

        // 3. Kiểm tra quy tắc "1 Active Commission Rule"
        boolean hasActiveCommission = repository.existsByNarratorIdAndStatusIn(requester.getId(), ACTIVE_REQUEST_STATUSES);
        boolean hasActiveContract = contractRepository.existsByFreelancerIdAndStatusIn(requester.getId(), ACTIVE_CONTRACT_STATUSES);
        if (hasActiveCommission || hasActiveContract) {
            throw new AppException(ErrorCode.ACTIVE_COMMISSION_EXISTS,
                    "Bạn đang có một yêu cầu hoặc hợp đồng đặt làm nội dung chưa hoàn tất. Vui lòng hoàn thành hoặc hủy yêu cầu hiện tại trước khi đặt Creator khác");
        }

        Instant now = Instant.now();
        Commission entity = Commission.builder()
                .creator(targetCreator)
                .narrator(requester)
                .channel(targetChannel)
                .contentType(normalizedContentType)
                .title(normalizedTitle)
                .description(request.getDescription().trim())
                .status(CommissionStatus.PENDING.name())
                .createdAt(now)
                .updatedAt(now)
                .build();

        Commission saved = repository.save(entity);
        log.info("User {} created Commission {} for creator {} (channel={}, type={})",
                requester.getEmail(), saved.getId(), targetCreator.getEmail(),
                targetChannel != null ? targetChannel.getId() : null, normalizedContentType);

        return toDetailedResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CommissionResponse findById(Long id) {
        User currentUser = getCurrentUser();
        Commission entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy yêu cầu đặt làm nội dung với ID: " + id));

        validateMemberOrAdmin(entity, currentUser);
        return toDetailedResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommissionResponse> getMySentRequests(String status, Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Commission> page = repository.findMySentRequests(currentUser.getId(), status, pageable);
        List<CommissionResponse> items = page.getContent().stream()
                .map(this::toDetailedResponse)
                .toList();
        return PageResponse.of(page, items);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommissionResponse> getMyReceivedRequests(String status, Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Commission> page = repository.findMyReceivedRequests(currentUser.getId(), status, pageable);
        List<CommissionResponse> items = page.getContent().stream()
                .map(this::toDetailedResponse)
                .toList();
        return PageResponse.of(page, items);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CommissionResponse> getMyCommissions(String status, Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Commission> page = repository.findMyCommissions(currentUser.getId(), status, pageable);
        List<CommissionResponse> items = page.getContent().stream()
                .map(this::toDetailedResponse)
                .toList();
        return PageResponse.of(page, items);
    }

    @Override
    public CommissionResponse acceptCommission(Long id) {
        User currentUser = getCurrentUser();
        Commission entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy yêu cầu đặt làm nội dung"));

        boolean isCreator = entity.getCreator() != null && entity.getCreator().getId().equals(currentUser.getId());
        if (!isCreator && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Creator chủ kênh nhận yêu cầu mới có quyền chấp nhận");
        }

        if (!CommissionStatus.PENDING.name().equalsIgnoreCase(entity.getStatus())) {
            throw new AppException(ErrorCode.HIRE_REQUEST_INVALID_STATE,
                    "Chỉ có thể chấp nhận khi yêu cầu đang ở trạng thái PENDING (Hiện tại: " + entity.getStatus() + ")");
        }

        entity.setStatus(CommissionStatus.ACCEPTED.name());
        entity.setUpdatedAt(Instant.now());
        Commission saved = repository.save(entity);

        log.info("Creator {} accepted Commission {}, chat room hire_request_{} unlocked",
                currentUser.getEmail(), id, id);
        return toDetailedResponse(saved);
    }

    @Override
    public CommissionResponse rejectCommission(Long id, RejectCommissionRequest request) {
        User currentUser = getCurrentUser();
        Commission entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy yêu cầu đặt làm nội dung"));

        boolean isCreator = entity.getCreator() != null && entity.getCreator().getId().equals(currentUser.getId());
        if (!isCreator && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Creator chủ kênh nhận yêu cầu mới có quyền từ chối");
        }

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST_DATA, "Vui lòng nhập lý do từ chối yêu cầu đặt làm nội dung");
        }

        String currentStatus = entity.getStatus() != null ? entity.getStatus().toUpperCase() : "";
        if (!CommissionStatus.PENDING.name().equals(currentStatus) && !CommissionStatus.ACCEPTED.name().equals(currentStatus)) {
            throw new AppException(ErrorCode.HIRE_REQUEST_INVALID_STATE,
                    "Chỉ có thể từ chối khi yêu cầu đang ở trạng thái PENDING hoặc ACCEPTED (Hiện tại: " + entity.getStatus() + ")");
        }

        entity.setStatus(CommissionStatus.REJECTED.name());
        entity.setRejectionReason(request.getReason().trim());
        entity.setUpdatedAt(Instant.now());
        Commission saved = repository.save(entity);

        log.info("Creator {} rejected Commission {} with reason: {}", currentUser.getEmail(), id, entity.getRejectionReason());
        return toDetailedResponse(saved);
    }

    @Override
    public CommissionResponse cancelCommission(Long id) {
        User currentUser = getCurrentUser();
        Commission entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy yêu cầu đặt làm nội dung"));

        boolean isRequester = entity.getNarrator() != null && entity.getNarrator().getId().equals(currentUser.getId());
        if (!isRequester && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Người đặt hàng tạo yêu cầu này mới có quyền hủy");
        }

        String currentStatus = entity.getStatus() != null ? entity.getStatus().toUpperCase() : "";
        if (!CommissionStatus.PENDING.name().equals(currentStatus) && !CommissionStatus.ACCEPTED.name().equals(currentStatus)) {
            throw new AppException(ErrorCode.HIRE_REQUEST_INVALID_STATE,
                    "Chỉ có thể hủy yêu cầu khi đang ở trạng thái PENDING hoặc ACCEPTED chưa tạo hợp đồng (Hiện tại: " + entity.getStatus() + ")");
        }

        entity.setStatus(CommissionStatus.CANCELLED.name());
        entity.setUpdatedAt(Instant.now());
        Commission saved = repository.save(entity);

        log.info("Requester {} cancelled Commission {}", currentUser.getEmail(), id);
        return toDetailedResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommissionResponse> findAll() {
        User currentUser = getCurrentUser();
        if (currentUser.hasRole(RoleEnum.ADMIN.name())) {
            return repository.findAll().stream().map(this::toDetailedResponse).toList();
        }
        return repository.findMyCommissions(currentUser.getId(), null, Pageable.unpaged())
                .getContent()
                .stream()
                .map(this::toDetailedResponse)
                .toList();
    }

    @Override
    public CommissionResponse update(Long id, CreateCommissionRequest request) {
        User currentUser = getCurrentUser();
        Commission entity = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HIRE_REQUEST_NOT_FOUND, "Không tìm thấy yêu cầu đặt làm nội dung"));

        boolean isRequester = entity.getNarrator() != null && entity.getNarrator().getId().equals(currentUser.getId());
        if (!isRequester && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Chỉ Người đặt hàng mới có quyền cập nhật nội dung yêu cầu");
        }

        if (!CommissionStatus.PENDING.name().equalsIgnoreCase(entity.getStatus())) {
            throw new AppException(ErrorCode.HIRE_REQUEST_INVALID_STATE, "Chỉ có thể chỉnh sửa yêu cầu khi đang ở trạng thái PENDING");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            entity.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            entity.setDescription(request.getDescription().trim());
        }
        if (request.getContentType() != null && !request.getContentType().isBlank()) {
            entity.setContentType(normalizeAndValidateContentType(request.getContentType()));
        }
        entity.setUpdatedAt(Instant.now());
        return toDetailedResponse(repository.save(entity));
    }

    @Override
    public void delete(Long id) {
        cancelCommission(id);
    }

    private String normalizeAndValidateContentType(String rawContentType) {
        if (rawContentType == null || rawContentType.isBlank()) {
            return CommissionContentType.SINGLE_VIDEO.name();
        }
        String normalized = rawContentType.trim().toUpperCase();
        if (!CommissionContentType.SINGLE_VIDEO.name().equals(normalized) && !CommissionContentType.SERIES.name().equals(normalized)) {
            throw new AppException(ErrorCode.INVALID_CONTENT_TYPE,
                    "Loại nội dung đặt hàng không hợp lệ (" + rawContentType + "). Chỉ hỗ trợ SINGLE_VIDEO (Video/Podcast lẻ) hoặc SERIES (Chuỗi nhiều tập)");
        }
        return normalized;
    }

    private void validateMemberOrAdmin(Commission entity, User currentUser) {
        boolean isCreator = entity.getCreator() != null && entity.getCreator().getId().equals(currentUser.getId());
        boolean isRequester = entity.getNarrator() != null && entity.getNarrator().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.hasRole(RoleEnum.ADMIN.name());
        if (!isCreator && !isRequester && !isAdmin) {
            throw new AppException(ErrorCode.FORBIDDEN_ACCESS, "Bạn không có quyền xem hoặc thao tác trên yêu cầu đặt nội dung này");
        }
    }

    private CommissionResponse toDetailedResponse(Commission entity) {
        User creator = entity.getCreator();
        User requester = entity.getNarrator();
        Channel channel = entity.getChannel();

        Long contractId = null;
        String contractStatus = null;
        if (entity.getId() != null) {
            Optional<Contract> contractOpt = contractRepository.findFirstByHireRequestIdOrderByIdDesc(entity.getId());
            if (contractOpt.isPresent()) {
                contractId = contractOpt.get().getId();
                contractStatus = contractOpt.get().getStatus() != null ? contractOpt.get().getStatus().name() : null;
            }
        }

        String status = entity.getStatus() != null ? entity.getStatus().toUpperCase() : CommissionStatus.PENDING.name();
        boolean chatUnlocked = CommissionStatus.ACCEPTED.name().equals(status)
                || CommissionStatus.CONTRACT_SENT.name().equals(status)
                || CommissionStatus.COMPLETED.name().equals(status);
        String conversationId = (chatUnlocked && entity.getId() != null) ? ("hire_request_" + entity.getId()) : null;

        return CommissionResponse.builder()
                .id(entity.getId())
                .requesterId(requester != null ? requester.getId() : null)
                .requesterFullName(requester != null ? requester.getFullName() : null)
                .requesterEmail(requester != null ? requester.getEmail() : null)
                .requesterAvatarUrl(requester != null ? requester.getAvatarUrl() : null)
                .narratorId(requester != null ? requester.getId() : null)
                .creatorId(creator != null ? creator.getId() : null)
                .creatorFullName(creator != null ? creator.getFullName() : null)
                .creatorEmail(creator != null ? creator.getEmail() : null)
                .creatorAvatarUrl(creator != null ? creator.getAvatarUrl() : null)
                .channelId(channel != null ? channel.getId() : null)
                .channelName(channel != null ? channel.getName() : null)
                .channelAvatarUrl(channel != null ? channel.getAvatarUrl() : null)
                .contentType(entity.getContentType() != null ? entity.getContentType() : CommissionContentType.SINGLE_VIDEO.name())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(status)
                .rejectionReason(entity.getRejectionReason())
                .contractId(contractId)
                .contractStatus(contractStatus)
                .conversationId(conversationId)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }
}
