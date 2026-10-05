package com.prm.identity.mapper;

import com.prm.identity.dto.request.FreelancerOnboardRequest;
import com.prm.identity.dto.response.FreelancerProfileResponse;
import com.prm.identity.entity.FreelancerProfile;
import com.prm.identity.entity.Role;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface FreelancerProfileMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    FreelancerProfile toEntity(FreelancerOnboardRequest request);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.email", target = "userEmail")
    @Mapping(source = "user.fullName", target = "userFullName")
    @Mapping(source = "user.avatarUrl", target = "userAvatarUrl")
    @Mapping(source = "user.phone", target = "userPhone")
    @Mapping(target = "roles", ignore = true)
    FreelancerProfileResponse toResponse(FreelancerProfile entity);

    @AfterMapping
    default void afterToResponse(FreelancerProfile entity, @MappingTarget FreelancerProfileResponse response) {
        if (entity != null && entity.getUser() != null && response != null) {
            Set<Role> roles = entity.getUser().getRoles();
            if (roles != null) {
                response.setRoles(roles.stream().map(Role::getName).collect(Collectors.toSet()));
            }
        }
    }
}
