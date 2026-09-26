package com.prm.channel.mapper;

import com.prm.channel.dto.request.ArtifactRequest;
import com.prm.channel.dto.response.ArtifactResponse;
import com.prm.channel.entity.Artifact;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ArtifactMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "content", ignore = true)
    Artifact toEntity(ArtifactRequest request);

    @Mapping(source = "content.id", target = "contentId")
    ArtifactResponse toResponse(Artifact entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "content", ignore = true)
    void updateEntityFromRequest(ArtifactRequest request, @MappingTarget Artifact entity);
}
