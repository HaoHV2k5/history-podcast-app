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
    MembershipPaymentResponse toResponse(MembershipPayment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "membership", ignore = true)
    void updateEntityFromRequest(MembershipPaymentRequest request, @MappingTarget MembershipPayment entity);
}
