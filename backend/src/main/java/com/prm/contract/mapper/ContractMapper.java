package com.prm.contract.mapper;

import com.prm.contract.dto.request.ContractRequest;
import com.prm.contract.dto.response.ContractResponse;
import com.prm.contract.entity.Contract;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ContractMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "hireRequest", ignore = true)
    Contract toEntity(ContractRequest request);

    @Mapping(source = "hireRequest.id", target = "hireRequestId")
    ContractResponse toResponse(Contract entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "hireRequest", ignore = true)
    void updateEntityFromRequest(ContractRequest request, @MappingTarget Contract entity);
}
