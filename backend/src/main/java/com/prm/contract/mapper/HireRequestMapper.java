package com.prm.contract.mapper;

import com.prm.contract.dto.request.HireRequestRequest;
import com.prm.contract.dto.response.HireRequestResponse;
import com.prm.contract.entity.HireRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface HireRequestMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "narrator", ignore = true)
    @Mapping(target = "channel", ignore = true)
    HireRequest toEntity(HireRequestRequest request);

    @Mapping(source = "creator.id", target = "creatorId")
    @Mapping(source = "narrator.id", target = "narratorId")
    @Mapping(source = "channel.id", target = "channelId")
    HireRequestResponse toResponse(HireRequest entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "narrator", ignore = true)
    @Mapping(target = "channel", ignore = true)
    void updateEntityFromRequest(HireRequestRequest request, @MappingTarget HireRequest entity);
}
