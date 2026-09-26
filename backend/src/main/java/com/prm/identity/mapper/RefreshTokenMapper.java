package com.prm.identity.mapper;

import com.prm.identity.dto.request.RefreshTokenRequest;
import com.prm.identity.dto.response.RefreshTokenResponse;
import com.prm.identity.entity.RefreshToken;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RefreshTokenMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    RefreshToken toEntity(RefreshTokenRequest request);

    @Mapping(source = "user.id", target = "userId")
    RefreshTokenResponse toResponse(RefreshToken entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(RefreshTokenRequest request, @MappingTarget RefreshToken entity);
}
