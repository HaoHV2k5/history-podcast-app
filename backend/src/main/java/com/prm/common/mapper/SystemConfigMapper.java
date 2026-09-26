package com.prm.common.mapper;

import com.prm.common.dto.request.SystemConfigRequest;
import com.prm.common.dto.response.SystemConfigResponse;
import com.prm.common.entity.SystemConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SystemConfigMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedByUser", ignore = true)
    SystemConfig toEntity(SystemConfigRequest request);

    @Mapping(source = "updatedByUser.id", target = "updatedByUserId")
    SystemConfigResponse toResponse(SystemConfig entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedByUser", ignore = true)
    void updateEntityFromRequest(SystemConfigRequest request, @MappingTarget SystemConfig entity);
}
