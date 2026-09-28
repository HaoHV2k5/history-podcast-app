package com.prm.identity.mapper;

import com.prm.identity.dto.request.SubmitKycRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.entity.KycProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface KycProfileMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "otpCode", ignore = true)
    @Mapping(target = "otpVerifiedAt", ignore = true)
    @Mapping(target = "lastOtpSentAt", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "verificationMethod", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    KycProfile toEntity(SubmitKycRequest request);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.email", target = "userEmail")
    KycProfileResponse toResponse(KycProfile entity);
}
