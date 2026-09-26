package com.prm.contract.mapper;

import com.prm.contract.dto.request.DeliverableRequest;
import com.prm.contract.dto.response.DeliverableResponse;
import com.prm.contract.entity.Deliverable;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DeliverableMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    Deliverable toEntity(DeliverableRequest request);

    @Mapping(source = "contract.id", target = "contractId")
    DeliverableResponse toResponse(Deliverable entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "contract", ignore = true)
    void updateEntityFromRequest(DeliverableRequest request, @MappingTarget Deliverable entity);
}
