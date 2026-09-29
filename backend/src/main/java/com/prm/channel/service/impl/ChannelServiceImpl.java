package com.prm.channel.service.impl;

import com.prm.channel.dto.request.CreateChannelRequest;
import com.prm.channel.dto.request.UpdateChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.entity.Channel;
import com.prm.channel.mapper.ChannelMapper;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.service.ChannelService;
import com.prm.common.dto.PageResponse;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.service.FileStorageService;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.entity.KycProfile;
import com.prm.identity.entity.User;
import com.prm.identity.repository.KycProfileRepository;
import com.prm.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChannelServiceImpl implements ChannelService {

    private final ChannelRepository repository;
    private final UserRepository userRepository;
    private final KycProfileRepository kycProfileRepository;
    private final FileStorageService fileStorageService;
    private final ChannelMapper mapper;

    @Override
    public ChannelResponse createChannel(CreateChannelRequest request) {
        User currentUser = getCurrentUser();

        // 1. Verify KYC status: User must be CREATOR role or have an APPROVED KYC profile
        boolean hasCreatorRole = currentUser.getRole() != null &&
                ("CREATOR".equalsIgnoreCase(currentUser.getRole().getName()) ||
                 "ADMIN".equalsIgnoreCase(currentUser.getRole().getName()));

        if (!hasCreatorRole) {
            KycProfile kycProfile = kycProfileRepository.findTopByUserIdOrderByIdDesc(currentUser.getId())
                    .orElse(null);

            if (kycProfile == null || !"APPROVED".equalsIgnoreCase(kycProfile.getStatus())) {
                throw new AppException(ErrorCode.KYC_REQUIRED_FOR_CHANNEL,
                        "Bạn cần hoàn tất và được duyệt KYC trước khi tạo kênh");
            }
        }

        // 2. Enforce 1-channel rule (BR-03)
        if (repository.existsByCreatorId(currentUser.getId())) {
            throw new AppException(ErrorCode.CHANNEL_ALREADY_EXISTS,
                    "Mỗi nhà sáng tạo chỉ được phép tạo 1 kênh duy nhất");
        }

        // 3. Enforce unique channel name (case-insensitive)
        String channelName = request.getName().trim();
        if (repository.existsByNameIgnoreCase(channelName)) {
            throw new AppException(ErrorCode.CHANNEL_NAME_EXISTS,
                    "Tên kênh '" + channelName + "' đã tồn tại, vui lòng chọn tên khác");
        }

        // 4. Build channel entity (anti-IDOR: creator is strictly bound to currentUser)
        Channel channel = mapper.toEntity(request);
        channel.setName(channelName);
        channel.setCreator(currentUser);
        channel.setStatus("ACTIVE");

        Channel saved = repository.save(channel);
        log.info("Created channel ID {} ('{}') for creator {}", saved.getId(), saved.getName(), currentUser.getEmail());
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ChannelResponse getMyChannel() {
        User currentUser = getCurrentUser();
        Channel channel = repository.findByCreatorId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Bạn chưa tạo kênh nào"));
        return mapper.toResponse(channel);
    }

    @Override
    @Transactional(readOnly = true)
    public ChannelResponse getChannelById(Long id) {
        Channel channel = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh với ID: " + id));
        return mapper.toResponse(channel);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ChannelResponse> getAllChannels(Pageable pageable) {
        Page<Channel> page = repository.findAllByStatus("ACTIVE", pageable);
        return PageResponse.of(page, page.getContent().stream().map(mapper::toResponse).toList());
    }

    @Override
    public ChannelResponse updateChannel(Long id, UpdateChannelRequest request) {
        User currentUser = getCurrentUser();
        Channel channel = repository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Không tìm thấy kênh với ID: " + id));

        // Authorization check: Only channel owner or Admin can update
        boolean isOwner = channel.getCreator() != null && channel.getCreator().getId().equals(currentUser.getId());
        boolean isAdmin = SecurityUtils.hasRole("ADMIN");

        if (!isOwner && !isAdmin) {
            throw new AppException(ErrorCode.CHANNEL_ACCESS_DENIED, "Bạn không có quyền chỉnh sửa kênh này");
        }

        // Unique name check if name is modified
        if (StringUtils.hasText(request.getName())) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(channel.getName()) && repository.existsByNameIgnoreCaseAndIdNot(newName, id)) {
                throw new AppException(ErrorCode.CHANNEL_NAME_EXISTS,
                        "Tên kênh '" + newName + "' đã tồn tại, vui lòng chọn tên khác");
            }
            channel.setName(newName);
        }

        mapper.updateEntityFromRequest(request, channel);
        Channel updated = repository.save(channel);
        log.info("Updated channel ID {} by user {}", id, currentUser.getEmail());
        return mapper.toResponse(updated);
    }

    @Override
    public ChannelResponse uploadAvatar(MultipartFile file) {
        User currentUser = getCurrentUser();
        Channel channel = repository.findByCreatorId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Bạn cần tạo kênh trước khi tải lên ảnh đại diện"));

        String avatarUrl = fileStorageService.uploadImage(file, "channels/avatars");
        channel.setAvatarUrl(avatarUrl);

        Channel updated = repository.save(channel);
        log.info("Updated avatar for channel ID {}: {}", channel.getId(), avatarUrl);
        return mapper.toResponse(updated);
    }

    @Override
    public ChannelResponse uploadCover(MultipartFile file) {
        User currentUser = getCurrentUser();
        Channel channel = repository.findByCreatorId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND, "Bạn cần tạo kênh trước khi tải lên ảnh bìa"));

        String coverUrl = fileStorageService.uploadImage(file, "channels/covers");
        channel.setCoverUrl(coverUrl);

        Channel updated = repository.save(channel);
        log.info("Updated cover for channel ID {}: {}", channel.getId(), coverUrl);
        return mapper.toResponse(updated);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
    }
}
