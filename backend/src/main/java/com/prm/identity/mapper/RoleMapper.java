package com.prm.identity.mapper;

import com.prm.identity.dto.request.RoleRequest;
import com.prm.identity.dto.response.RoleResponse;
import com.prm.identity.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RoleMapper {

    @Mapping(target = "id", ignore = true)
    Role toEntity(RoleRequest request);

    RoleResponse toResponse(Role entity);

    @Mapping(target = "id", ignore = true)
    void updateEntityFromRequest(RoleRequest request, @MappingTarget Role entity);
}
