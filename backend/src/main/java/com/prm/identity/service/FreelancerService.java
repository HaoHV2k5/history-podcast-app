package com.prm.identity.service;

import com.prm.identity.dto.request.FreelancerOnboardRequest;
import com.prm.identity.dto.response.FreelancerProfileResponse;

public interface FreelancerService {

    FreelancerProfileResponse onboard(FreelancerOnboardRequest request);

    FreelancerProfileResponse getMyProfile();

    FreelancerProfileResponse updateMyProfile(FreelancerOnboardRequest request);

    FreelancerProfileResponse getProfileByUserId(Long userId);
}
