package com.prm.identity.mapper;

import com.prm.identity.dto.request.UserRequest;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    User toEntity(UserRequest request);

    @Mapping(source = "role.id", target = "roleId")
    UserResponse toResponse(User entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    void updateEntityFromRequest(UserRequest request, @MappingTarget User entity);
}
