package com.prm.identity.mapper;

import com.prm.identity.dto.request.AdminCreateUserRequest;
import com.prm.identity.dto.request.AdminUpdateUserRequest;
import com.prm.identity.dto.request.UpdateUserProfileRequest;
import com.prm.identity.dto.request.UserRequest;
import com.prm.identity.dto.response.UserResponse;
import com.prm.identity.entity.User;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toEntity(UserRequest request);

    @Mapping(source = "role.id", target = "roleId")
    @Mapping(source = "role.name", target = "roleName")
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "isCreator", ignore = true)
    @Mapping(target = "isFreelancer", ignore = true)
    @Mapping(target = "isAdmin", ignore = true)
    UserResponse toResponse(User entity);

    @org.mapstruct.AfterMapping
    default void afterToResponse(User entity, @MappingTarget UserResponse response) {
        if (entity != null && response != null) {
            java.util.Set<com.prm.identity.entity.Role> entityRoles = entity.getRoles();
            if (entityRoles != null && !entityRoles.isEmpty()) {
                java.util.Set<String> roleNames = entityRoles.stream()
                        .map(com.prm.identity.entity.Role::getName)
                        .collect(java.util.stream.Collectors.toSet());
                response.setRoles(roleNames);
                response.setIsCreator(roleNames.contains("CREATOR"));
                response.setIsFreelancer(roleNames.contains("FREELANCER"));
                response.setIsAdmin(roleNames.contains("ADMIN"));

                if (response.getRoleId() == null || response.getRoleName() == null) {
                    com.prm.identity.entity.Role primary = entity.getRole();
                    if (primary != null) {
                        response.setRoleId(primary.getId());
                        response.setRoleName(primary.getName());
                    }
                }
            } else {
                response.setRoles(java.util.Collections.emptySet());
                response.setIsCreator(false);
                response.setIsFreelancer(false);
                response.setIsAdmin(false);
            }
        }
    }

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(UserRequest request, @MappingTarget User entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromProfileRequest(UpdateUserProfileRequest request, @MappingTarget User entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User toEntityFromAdminCreate(AdminCreateUserRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromAdminUpdate(AdminUpdateUserRequest request, @MappingTarget User entity);
}
