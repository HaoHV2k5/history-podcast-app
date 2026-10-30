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

    default UserResponse toResponse(User entity) {
        if (entity == null) {
            return null;
        }

        java.util.Set<com.prm.identity.entity.Role> entityRoles = entity.getRoles();
        java.util.Set<String> roleNames = new java.util.HashSet<>();
        if (entityRoles != null) {
            for (com.prm.identity.entity.Role r : entityRoles) {
                if (r != null && r.getName() != null) {
                    roleNames.add(r.getName());
                }
            }
        }
        if (entity.getRole() != null && entity.getRole().getName() != null) {
            roleNames.add(entity.getRole().getName());
        }

        Long roleId = entity.getRole() != null ? entity.getRole().getId() : null;
        String roleName = entity.getRole() != null ? entity.getRole().getName() : (roleNames.isEmpty() ? "VIEWER" : roleNames.iterator().next());

        return UserResponse.builder()
                .id(entity.getId())
                .roleId(roleId)
                .roleName(roleName)
                .roles(roleNames)
                .isCreator(roleNames.contains("CREATOR"))
                .isFreelancer(roleNames.contains("FREELANCER"))
                .isAdmin(roleNames.contains("ADMIN"))
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .fullName(entity.getFullName())
                .avatarUrl(entity.getAvatarUrl())
                .bio(entity.getBio())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
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
