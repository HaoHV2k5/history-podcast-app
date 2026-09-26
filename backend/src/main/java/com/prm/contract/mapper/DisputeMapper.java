package com.prm.contract.mapper;

import com.prm.contract.dto.request.DisputeRequest;
import com.prm.contract.dto.response.DisputeResponse;
import com.prm.contract.entity.Dispute;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DisputeMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    @Mapping(target = "raisedByUser", ignore = true)
    @Mapping(target = "resolvedByUser", ignore = true)
    Dispute toEntity(DisputeRequest request);

    @Mapping(source = "contract.id", target = "contractId")
    @Mapping(source = "raisedByUser.id", target = "raisedByUserId")
    @Mapping(source = "resolvedByUser.id", target = "resolvedByUserId")
    DisputeResponse toResponse(Dispute entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    @Mapping(target = "raisedByUser", ignore = true)
    @Mapping(target = "resolvedByUser", ignore = true)
    void updateEntityFromRequest(DisputeRequest request, @MappingTarget Dispute entity);
}
