package com.prm.narrator.mapper;

import com.prm.narrator.dto.request.NarratorDemoRequest;
import com.prm.narrator.dto.response.NarratorDemoResponse;
import com.prm.narrator.entity.NarratorDemo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface NarratorDemoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "narratorProfile", ignore = true)
    NarratorDemo toEntity(NarratorDemoRequest request);

    @Mapping(source = "narratorProfile.id", target = "narratorProfileId")
    NarratorDemoResponse toResponse(NarratorDemo entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "narratorProfile", ignore = true)
    void updateEntityFromRequest(NarratorDemoRequest request, @MappingTarget NarratorDemo entity);
}
