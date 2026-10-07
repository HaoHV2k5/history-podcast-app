package com.prm.contract.service.impl;

import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.contract.constant.ApplicationStatus;
import com.prm.contract.constant.PostStatus;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.dto.request.ApplyPostRequest;
import com.prm.contract.dto.request.CreatePostRequest;
import com.prm.contract.dto.request.UpdatePostRequest;
import com.prm.contract.dto.response.ApplicationResponse;
import com.prm.contract.dto.response.PostResponse;
import com.prm.contract.entity.Application;
import com.prm.contract.entity.Post;
import com.prm.contract.repository.ApplicationRepository;
import com.prm.contract.repository.PostRepository;
import com.prm.contract.service.PostService;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.entity.FreelancerProfile;
import com.prm.identity.entity.User;
import com.prm.identity.repository.FreelancerProfileRepository;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final FreelancerProfileRepository freelancerProfileRepository;

    @Override
    public PostResponse createPost(CreatePostRequest request) {
        User currentUser = getCurrentUser();

        // 1. Kiểm tra vai trò theo loại bài
        if (request.getType() == PostType.BOOKING) {
            if (!currentUser.hasRole(RoleEnum.CREATOR.name()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
                throw new AppException(ErrorCode.CREATOR_ROLE_REQUIRED, "Chỉ tài khoản Creator (đã xác thực SĐT) mới có quyền đăng bài booking");
            }
        } else if (request.getType() == PostType.JOB_SEEKING) {
            if (!currentUser.hasRole(RoleEnum.FREELANCER.name()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
                throw new AppException(ErrorCode.FREELANCER_ROLE_REQUIRED, "Chỉ tài khoản Freelancer mới có quyền đăng bài tìm việc");
            }
        }

        int expiresInDays = (request.getExpiresInDays() != null && request.getExpiresInDays() > 0)
                ? request.getExpiresInDays() : 30;

        Post post = Post.builder()
                .user(currentUser)
                .type(request.getType())
                .serviceType(request.getServiceType())
                .title(request.getTitle())
                .description(request.getDescription())
                .referencePrice(request.getReferencePrice())
                .status(PostStatus.OPEN)
                .expiresAt(Instant.now().plus(expiresInDays, ChronoUnit.DAYS))
                .build();

        Post saved = postRepository.save(post);
        log.info("Created post {} by user {}", saved.getId(), currentUser.getEmail());
        return toPostResponse(saved, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> searchPosts(
            PostType type,
            ServiceType serviceType,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String keyword,
            Pageable pageable
    ) {
        Page<Post> page = postRepository.searchPosts(type, serviceType, minPrice, maxPrice, keyword, pageable);
        List<PostResponse> content = page.getContent().stream()
                .map(p -> toPostResponse(p, applicationRepository.findByPostId(p.getId()).size()))
                .toList();
        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng id: " + id));
        int appCount = applicationRepository.findByPostId(post.getId()).size();
        return toPostResponse(post, appCount);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PostResponse> getMyPosts(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Post> page = postRepository.findByUserId(currentUser.getId(), pageable);
        List<PostResponse> content = page.getContent().stream()
                .map(p -> toPostResponse(p, applicationRepository.findByPostId(p.getId()).size()))
                .toList();
        return PageResponse.of(page, content);
    }

    @Override
    public PostResponse updatePost(Long id, UpdatePostRequest request) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng id: " + id));

        if (!post.getUser().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.POST_ACCESS_DENIED, "Bạn không có quyền sửa bài đăng này");
        }

        if (StringUtils.hasText(request.getTitle())) {
            post.setTitle(request.getTitle());
        }
        if (StringUtils.hasText(request.getDescription())) {
            post.setDescription(request.getDescription());
        }
        if (request.getReferencePrice() != null) {
            post.setReferencePrice(request.getReferencePrice());
        }
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }

        Post updated = postRepository.save(post);
        return toPostResponse(updated, applicationRepository.findByPostId(updated.getId()).size());
    }

    @Override
    public void deletePost(Long id) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng id: " + id));

        if (!post.getUser().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.POST_ACCESS_DENIED, "Bạn không có quyền xóa bài đăng này");
        }

        post.setStatus(PostStatus.CLOSED);
        postRepository.save(post);
    }

    @Override
    public ApplicationResponse applyToPost(Long postId, ApplyPostRequest request) {
        User currentUser = getCurrentUser();

        // 1. Kiểm tra quyền Freelancer
        if (!currentUser.hasRole(RoleEnum.FREELANCER.name())) {
            throw new AppException(ErrorCode.FREELANCER_ROLE_REQUIRED, "Chỉ Freelancer mới có thể nộp đơn ứng tuyển");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng"));

        // 2. Không ứng tuyển bài chính mình
        if (post.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.CANNOT_APPLY_OWN_POST, "Bạn không thể ứng tuyển vào bài đăng của chính mình");
        }

        // 3. Bài phải đang mở
        if (post.getStatus() != PostStatus.OPEN) {
            throw new AppException(ErrorCode.POST_NOT_OPEN, "Bài đăng này hiện không nhận đơn ứng tuyển");
        }

        // 4. Kiểm tra đã ứng tuyển trước đó chưa
        if (applicationRepository.existsByPostIdAndApplicantId(postId, currentUser.getId())) {
            throw new AppException(ErrorCode.APPLICATION_ALREADY_EXISTS, "Bạn đã nộp đơn ứng tuyển cho bài đăng này rồi");
        }

        Application application = Application.builder()
                .post(post)
                .applicant(currentUser)
                .message(request.getMessage())
                .proposedPrice(request.getProposedPrice())
                .status(ApplicationStatus.PENDING)
                .build();

        Application saved = applicationRepository.save(application);
        log.info("Freelancer {} applied to post {}", currentUser.getEmail(), postId);
        return toApplicationResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> getApplicationsByPost(Long postId, Pageable pageable) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng"));

        if (!post.getUser().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.POST_ACCESS_DENIED, "Chỉ chủ bài đăng mới có thể xem danh sách ứng tuyển");
        }

        Page<Application> page = applicationRepository.findByPostId(postId, pageable);
        List<ApplicationResponse> content = page.getContent().stream()
                .map(this::toApplicationResponse)
                .toList();
        return PageResponse.of(page, content);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ApplicationResponse> getMyApplications(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<Application> page = applicationRepository.findByApplicantId(currentUser.getId(), pageable);
        List<ApplicationResponse> content = page.getContent().stream()
                .map(this::toApplicationResponse)
                .toList();
        return PageResponse.of(page, content);
    }

    @Override
    public ApplicationResponse chooseApplicant(Long postId, Long applicantId) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND, "Không tìm thấy bài đăng"));

        if (!post.getUser().getId().equals(currentUser.getId()) && !currentUser.hasRole(RoleEnum.ADMIN.name())) {
            throw new AppException(ErrorCode.POST_ACCESS_DENIED, "Chỉ chủ bài đăng mới có quyền chọn ứng viên");
        }

        Application chosenApp = applicationRepository.findByPostIdAndApplicantId(postId, applicantId)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND, "Không tìm thấy đơn ứng tuyển của ứng viên"));

        chosenApp.setStatus(ApplicationStatus.CHOSEN);
        applicationRepository.save(chosenApp);

        // Reject other pending applications
        List<Application> others = applicationRepository.findByPostIdAndStatus(postId, ApplicationStatus.PENDING);
        for (Application other : others) {
            if (!other.getId().equals(chosenApp.getId())) {
                other.setStatus(ApplicationStatus.REJECTED);
                applicationRepository.save(other);
            }
        }

        // Đổi trạng thái bài đăng sang IN_CONTRACT
        post.setStatus(PostStatus.IN_CONTRACT);
        postRepository.save(post);

        log.info("Post {} selected applicant {}", postId, applicantId);
        return toApplicationResponse(chosenApp);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy người dùng hiện tại"));
    }

    private PostResponse toPostResponse(Post post, int applicationCount) {
        User author = post.getUser();
        String headline = null;
        if (author.hasRole(RoleEnum.FREELANCER.name())) {
            headline = freelancerProfileRepository.findByUserId(author.getId())
                    .map(FreelancerProfile::getHeadline)
                    .orElse(null);
        }

        return PostResponse.builder()
                .id(post.getId())
                .userId(author.getId())
                .userFullName(author.getFullName())
                .userAvatarUrl(author.getAvatarUrl())
                .userHeadline(headline)
                .type(post.getType())
                .serviceType(post.getServiceType())
                .title(post.getTitle())
                .description(post.getDescription())
                .referencePrice(post.getReferencePrice())
                .status(post.getStatus())
                .expiresAt(post.getExpiresAt())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .applicationCount(applicationCount)
                .build();
    }

    private ApplicationResponse toApplicationResponse(Application app) {
        User applicant = app.getApplicant();
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(applicant.getId()).orElse(null);

        return ApplicationResponse.builder()
                .id(app.getId())
                .postId(app.getPost().getId())
                .postTitle(app.getPost().getTitle())
                .applicantId(applicant.getId())
                .applicantFullName(applicant.getFullName())
                .applicantAvatarUrl(applicant.getAvatarUrl())
                .applicantHeadline(profile != null ? profile.getHeadline() : null)
                .applicantServiceTypes(profile != null ? profile.getServiceTypes() : null)
                .applicantPortfolioUrl(profile != null ? profile.getPortfolioUrl() : null)
                .applicantVoiceDemoUrl(profile != null ? profile.getVoiceDemoUrl() : null)
                .message(app.getMessage())
                .proposedPrice(app.getProposedPrice())
                .status(app.getStatus())
                .createdAt(app.getCreatedAt())
                .build();
    }
}
