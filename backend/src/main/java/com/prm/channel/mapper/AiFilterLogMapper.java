package com.prm.channel.mapper;

import com.prm.channel.dto.request.AiFilterLogRequest;
import com.prm.channel.dto.response.AiFilterLogResponse;
import com.prm.channel.entity.AiFilterLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AiFilterLogMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    AiFilterLog toEntity(AiFilterLogRequest request);

    @Mapping(source = "artifact.id", target = "artifactId")
    AiFilterLogResponse toResponse(AiFilterLog entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    void updateEntityFromRequest(AiFilterLogRequest request, @MappingTarget AiFilterLog entity);
}
