package com.prm.identity.service;

import com.prm.common.dto.PageResponse;
import com.prm.identity.dto.request.SendEmailOtpRequest;
import com.prm.identity.dto.request.SubmitKycRequest;
import com.prm.identity.dto.request.UpdateKycStatusRequest;
import com.prm.identity.dto.request.VerifyEmailOtpRequest;
import com.prm.identity.dto.request.VerifyPhoneRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import org.springframework.data.domain.Pageable;

public interface KycProfileService {

    /**
     * Send an OTP code to email for creator KYC with 60s anti-spam cooldown.
     */
    void sendEmailOtp(SendEmailOtpRequest request);

    /**
     * Verify the email OTP code.
     */
    void verifyEmailOtp(VerifyEmailOtpRequest request);

    /**
     * Verify phone authentication token.
     */
    void verifyPhone(VerifyPhoneRequest request);

    /**
     * Submit KYC profile for creator application.
     */
    KycProfileResponse submitKyc(SubmitKycRequest request);

    /**
     * Get KYC profile of current authenticated user.
     */
    KycProfileResponse getMyKycProfile();

    /**
     * [Admin] List KYC profiles with optional status filtering and pagination.
     */
    PageResponse<KycProfileResponse> getKycProfiles(String status, Pageable pageable);

    /**
     * [Admin] Approve or Reject a KYC profile. Approving elevates user role to CREATOR.
     */
    KycProfileResponse updateKycStatus(Long id, UpdateKycStatusRequest request);
}
