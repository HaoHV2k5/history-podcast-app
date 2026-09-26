package com.prm.membership.mapper;

import com.prm.membership.dto.request.MembershipRequest;
import com.prm.membership.dto.response.MembershipResponse;
import com.prm.membership.entity.Membership;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface MembershipMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "viewer", ignore = true)
    @Mapping(target = "channel", ignore = true)
    Membership toEntity(MembershipRequest request);

    @Mapping(source = "viewer.id", target = "viewerId")
    @Mapping(source = "channel.id", target = "channelId")
    MembershipResponse toResponse(Membership entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "viewer", ignore = true)
    @Mapping(target = "channel", ignore = true)
    void updateEntityFromRequest(MembershipRequest request, @MappingTarget Membership entity);
}
