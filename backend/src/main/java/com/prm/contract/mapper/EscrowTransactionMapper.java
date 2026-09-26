package com.prm.contract.mapper;

import com.prm.contract.dto.request.EscrowTransactionRequest;
import com.prm.contract.dto.response.EscrowTransactionResponse;
import com.prm.contract.entity.EscrowTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EscrowTransactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    EscrowTransaction toEntity(EscrowTransactionRequest request);

    @Mapping(source = "contract.id", target = "contractId")
    EscrowTransactionResponse toResponse(EscrowTransaction entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    void updateEntityFromRequest(EscrowTransactionRequest request, @MappingTarget EscrowTransaction entity);
}
