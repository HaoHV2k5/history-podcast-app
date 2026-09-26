package com.prm.identity.mapper;

import com.prm.identity.dto.request.KycProfileRequest;
import com.prm.identity.dto.response.KycProfileResponse;
import com.prm.identity.entity.KycProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface KycProfileMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    KycProfile toEntity(KycProfileRequest request);

    @Mapping(source = "user.id", target = "userId")
    KycProfileResponse toResponse(KycProfile entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(KycProfileRequest request, @MappingTarget KycProfile entity);
}
