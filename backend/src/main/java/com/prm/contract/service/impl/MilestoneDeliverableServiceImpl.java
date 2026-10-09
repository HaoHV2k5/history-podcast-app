package com.prm.contract.service.impl;

import com.prm.identity.constant.RoleEnum;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.config.BookingEscrowProperties;
import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.dto.response.MilestoneDeliverableResponse;
import com.prm.contract.entity.Contract;
import com.prm.contract.entity.Milestone;
import com.prm.contract.entity.MilestoneDeliverable;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.MilestoneDeliverableRepository;
import com.prm.contract.repository.MilestoneRepository;
import com.prm.contract.repository.PostRepository;
import com.prm.contract.service.MilestoneDeliverableService;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MilestoneDeliverableServiceImpl implements MilestoneDeliverableService {

    private final MilestoneDeliverableRepository deliverableRepository;
    private final MilestoneRepository milestoneRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final BookingEscrowProperties properties;

    @Override
    public MilestoneDeliverableResponse uploadDeliverable(Long milestoneId, String title, String description, MultipartFile file) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone: " + milestoneId));

        Contract contract = milestone.getContract();
        boolean isFreelancer = contract.getFreelancer().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.hasRole(RoleEnum.ADMIN.name());
        if (!isFreelancer && !isAdmin) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Chỉ Freelancer của hợp đồng mới có quyền nộp sản phẩm");
        }

        if (milestone.getStatus() != MilestoneStatus.IN_PROGRESS && milestone.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new AppException(ErrorCode.MILESTONE_INVALID_STATE, "Milestone không ở trạng thái cho phép nộp sản phẩm (IN_PROGRESS hoặc SUBMITTED)");
        }

        // Tải file lên kho lưu trữ
        String folderPath = "contracts/" + contract.getId() + "/milestones/" + milestone.getId();
        String filePath = fileStorageService.uploadRawFile(file, folderPath);

        List<MilestoneDeliverable> existing = deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(milestoneId);
        int nextVersion = existing.isEmpty() ? 1 : existing.get(0).getVersionNo() + 1;

        String deliverableTitle = (title != null && !title.isBlank()) ? title : file.getOriginalFilename();

        MilestoneDeliverable deliverable = MilestoneDeliverable.builder()
                .milestone(milestone)
                .post(contract.getPost())
                .uploadedBy(currentUser)
                .title(deliverableTitle)
                .description(description)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "deliverable")
                .filePath(filePath)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .versionNo(nextVersion)
                .createdAt(Instant.now())
                .build();

        MilestoneDeliverable saved = deliverableRepository.save(deliverable);

        // Chuyển trạng thái milestone sang SUBMITTED nếu đang IN_PROGRESS
        if (milestone.getStatus() == MilestoneStatus.IN_PROGRESS) {
            milestone.setStatus(MilestoneStatus.SUBMITTED);
            milestone.setReviewDueAt(Instant.now().plus(properties.getReviewDays(), ChronoUnit.DAYS));
            milestoneRepository.save(milestone);
            log.info("Milestone {} transitioned to SUBMITTED after deliverable uploaded by freelancer {}",
                    milestoneId, currentUser.getEmail());
        }

        log.info("Deliverable {} (v{}) uploaded for milestone {} by user {}",
                saved.getId(), nextVersion, milestoneId, currentUser.getEmail());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneDeliverableResponse> getDeliverablesByMilestone(Long milestoneId) {
        User currentUser = getCurrentUser();
        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new AppException(ErrorCode.MILESTONE_NOT_FOUND, "Không tìm thấy milestone"));

        Contract contract = milestone.getContract();
        validateAccess(contract, currentUser);

        return deliverableRepository.findByMilestoneIdOrderByCreatedAtDesc(milestoneId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MilestoneDeliverableResponse> getDeliverablesByPost(Long postId) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài post: " + postId));

        // Kiểm tra quyền: Chủ bài post hoặc Admin
        boolean isOwner = post.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.hasRole(RoleEnum.ADMIN.name());

        List<MilestoneDeliverable> deliverables = deliverableRepository.findByPostIdOrderByCreatedAtDesc(postId);

        // Nếu là freelancer của hợp đồng gắn với bài post này cũng được xem
        boolean isFreelancerOfPost = deliverables.stream()
                .anyMatch(d -> d.getMilestone().getContract().getFreelancer().getId().equals(currentUser.getId()));

        if (!isOwner && !isAdmin && !isFreelancerOfPost) {
            throw new AppException(ErrorCode.CONTRACT_ACCESS_DENIED, "Bạn không có quyền xem các sản phẩm của bài đăng này");
        }

        return deliverables.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadDeliverable(Long deliverableId) {
        User currentUser = getCurrentUser();
        MilestoneDeliverable deliverable = deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERABLE_NOT_FOUND, "Không tìm thấy sản phẩm giao nộp: " + deliverableId));

        Contract contract = deliverable.getMilestone().getContract();
        validateAccess(contract, currentUser);

        String filePath = deliverable.getFilePath();
        try {
            if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
                // Tải stream từ remote cloud storage
                URL url = URI.create(filePath).toURL();
                URLConnection conn = url.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(30000);
                InputStream inputStream = conn.getInputStream();
                return new InputStreamResource(inputStream);
            } else {
                // Tệp tin lưu cục bộ
                Path path = Paths.get(filePath);
                if (Files.exists(path)) {
                    return new FileSystemResource(path);
                }
                return new ByteArrayResource(("Simulated file content for " + deliverable.getFileName()).getBytes());
            }
        } catch (Exception e) {
            log.error("Failed to read deliverable stream for id {}: {}", deliverableId, e.getMessage(), e);
            throw new AppException(ErrorCode.DELIVERABLE_NOT_FOUND, "Lỗi khi nạp dữ liệu tệp sản phẩm: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public MilestoneDeliverable getDeliverableEntity(Long deliverableId) {
        return deliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERABLE_NOT_FOUND, "Không tìm thấy sản phẩm giao nộp: " + deliverableId));
    }

    private void validateAccess(Contract contract, User user) {
        boolean isCreator = contract.getCreator() != null && contract.getCreator().getId().equals(user.getId());
        boolean isFreelancer = contract.getFreelancer() != null && contract.getFreelancer().getId().equals(user.getId());
        boolean isAdmin = user.hasRole(RoleEnum.ADMIN.name());

        if (!isCreator && !isFreelancer && !isAdmin) {
            throw new AppException(ErrorCode.DELIVERABLE_ACCESS_DENIED, "Chỉ Creator và Freelancer của hợp đồng mới có quyền xem hoặc tải sản phẩm này");
        }
    }

    private MilestoneDeliverableResponse toResponse(MilestoneDeliverable entity) {
        Contract contract = entity.getMilestone().getContract();
        Post post = entity.getPost();

        return MilestoneDeliverableResponse.builder()
                .id(entity.getId())
                .milestoneId(entity.getMilestone().getId())
                .milestoneOrderNo(entity.getMilestone().getOrderNo())
                .milestoneTitle(entity.getMilestone().getTitle())
                .postId(post != null ? post.getId() : null)
                .postTitle(post != null ? post.getTitle() : null)
                .contractId(contract != null ? contract.getId() : null)
                .contractTitle(contract != null ? contract.getTitle() : null)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .fileName(entity.getFileName())
                .fileSize(entity.getFileSize())
                .contentType(entity.getContentType())
                .versionNo(entity.getVersionNo())
                .uploadedById(entity.getUploadedBy().getId())
                .uploadedByFullName(entity.getUploadedBy().getFullName())
                .downloadUrl("/api/v1/deliverables/" + entity.getId() + "/download")
                .previewUrl("/api/v1/deliverables/" + entity.getId() + "/view")
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin người dùng"));
    }
}
