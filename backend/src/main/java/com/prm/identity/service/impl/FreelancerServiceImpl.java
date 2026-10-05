package com.prm.identity.service.impl;

import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.common.util.SecurityUtils;
import com.prm.identity.constant.RoleEnum;
import com.prm.identity.dto.request.FreelancerOnboardRequest;
import com.prm.identity.dto.response.FreelancerProfileResponse;
import com.prm.identity.entity.FreelancerProfile;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.mapper.FreelancerProfileMapper;
import com.prm.identity.repository.FreelancerProfileRepository;
import com.prm.identity.repository.RoleRepository;
import com.prm.identity.repository.UserRepository;
import com.prm.identity.service.FreelancerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class FreelancerServiceImpl implements FreelancerService {

    private final FreelancerProfileRepository freelancerProfileRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FreelancerProfileMapper mapper;

    @Override
    public FreelancerProfileResponse onboard(FreelancerOnboardRequest request) {
        User currentUser = getCurrentUser();

        // 1. Tìm hoặc tạo mới hồ sơ freelancer
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> FreelancerProfile.builder()
                        .user(currentUser)
                        .status("ACTIVE")
                        .build());

        profile.setHeadline(request.getHeadline());
        profile.setBio(request.getBio());
        profile.setSkills(request.getSkills());
        profile.setServiceTypes(request.getServiceTypes());
        profile.setVoiceDemoUrl(request.getVoiceDemoUrl());
        profile.setReferencePrice(request.getReferencePrice());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setStatus("ACTIVE");
        profile.setUpdatedAt(Instant.now());

        FreelancerProfile savedProfile = freelancerProfileRepository.save(profile);

        // 2. Gán thêm role FREELANCER cho user (M - M)
        if (!currentUser.hasRole(RoleEnum.FREELANCER.name())) {
            Role freelancerRole = roleRepository.findByName(RoleEnum.FREELANCER.name())
                    .orElseGet(() -> roleRepository.save(Role.builder()
                            .name(RoleEnum.FREELANCER.name())
                            .description("Freelancer role for taking jobs")
                            .build()));
            currentUser.addRole(freelancerRole);
            userRepository.save(currentUser);
            log.info("Assigned FREELANCER role to user {}", currentUser.getEmail());
        }

        log.info("User {} successfully onboarded as Freelancer with profile ID {}",
                currentUser.getEmail(), savedProfile.getId());
        return mapper.toResponse(savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public FreelancerProfileResponse getMyProfile() {
        User currentUser = getCurrentUser();
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Bạn chưa tạo hồ sơ Freelancer"));
        return mapper.toResponse(profile);
    }

    @Override
    public FreelancerProfileResponse updateMyProfile(FreelancerOnboardRequest request) {
        User currentUser = getCurrentUser();
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Bạn chưa tạo hồ sơ Freelancer"));

        if (StringUtils.hasText(request.getHeadline())) {
            profile.setHeadline(request.getHeadline());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getSkills() != null) {
            profile.setSkills(request.getSkills());
        }
        if (request.getServiceTypes() != null) {
            profile.setServiceTypes(request.getServiceTypes());
        }
        if (request.getVoiceDemoUrl() != null) {
            profile.setVoiceDemoUrl(request.getVoiceDemoUrl());
        }
        if (request.getReferencePrice() != null) {
            profile.setReferencePrice(request.getReferencePrice());
        }
        if (request.getPortfolioUrl() != null) {
            profile.setPortfolioUrl(request.getPortfolioUrl());
        }
        profile.setUpdatedAt(Instant.now());

        FreelancerProfile saved = freelancerProfileRepository.save(profile);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FreelancerProfileResponse getProfileByUserId(Long userId) {
        FreelancerProfile profile = freelancerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy hồ sơ Freelancer của người dùng: " + userId));
        return mapper.toResponse(profile);
    }

    private User getCurrentUser() {
        String email = SecurityUtils.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND, "Không tìm thấy thông tin tài khoản người dùng"));
    }
}
