package com.prm.common.mapper;

import com.prm.common.dto.request.AuditLogRequest;
import com.prm.common.dto.response.AuditLogResponse;
import com.prm.common.entity.AuditLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "actor", ignore = true)
    AuditLog toEntity(AuditLogRequest request);

    @Mapping(source = "actor.id", target = "actorId")
    AuditLogResponse toResponse(AuditLog entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "actor", ignore = true)
    void updateEntityFromRequest(AuditLogRequest request, @MappingTarget AuditLog entity);
}
