package com.prm.channel.mapper;

import com.prm.channel.dto.request.TranscriptRequest;
import com.prm.channel.dto.response.TranscriptResponse;
import com.prm.channel.entity.Transcript;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TranscriptMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    Transcript toEntity(TranscriptRequest request);

    @Mapping(source = "artifact.id", target = "artifactId")
    TranscriptResponse toResponse(Transcript entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    void updateEntityFromRequest(TranscriptRequest request, @MappingTarget Transcript entity);
}
