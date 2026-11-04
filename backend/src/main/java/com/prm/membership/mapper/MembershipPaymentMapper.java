package com.prm.membership.mapper;

import com.prm.membership.dto.request.MembershipPaymentRequest;
import com.prm.membership.dto.response.MembershipPaymentResponse;
import com.prm.membership.entity.MembershipPayment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface MembershipPaymentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "membership", ignore = true)
    MembershipPayment toEntity(MembershipPaymentRequest request);

    @Mapping(source = "membership.id", target = "membershipId")
    @Mapping(source = "membership.viewer.id", target = "viewerId")
    @Mapping(source = "membership.viewer.fullName", target = "viewerFullName")
    @Mapping(source = "membership.viewer.email", target = "viewerEmail")
    @Mapping(source = "membership.viewer.avatarUrl", target = "viewerAvatarUrl")
    @Mapping(source = "membership.channel.id", target = "channelId")
    @Mapping(source = "membership.channel.name", target = "channelName")
    @Mapping(source = "membership.plan.name", target = "planName")
    MembershipPaymentResponse toResponse(MembershipPayment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "membership", ignore = true)
    void updateEntityFromRequest(MembershipPaymentRequest request, @MappingTarget MembershipPayment entity);
}
