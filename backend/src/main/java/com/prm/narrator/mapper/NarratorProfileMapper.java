package com.prm.narrator.mapper;

import com.prm.narrator.dto.request.NarratorProfileRequest;
import com.prm.narrator.dto.response.NarratorProfileResponse;
import com.prm.narrator.entity.NarratorProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface NarratorProfileMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    NarratorProfile toEntity(NarratorProfileRequest request);

    @Mapping(source = "user.id", target = "userId")
    NarratorProfileResponse toResponse(NarratorProfile entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(NarratorProfileRequest request, @MappingTarget NarratorProfile entity);
}
