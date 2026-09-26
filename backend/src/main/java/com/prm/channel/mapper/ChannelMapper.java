package com.prm.channel.mapper;

import com.prm.channel.dto.request.ChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.entity.Channel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ChannelMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    Channel toEntity(ChannelRequest request);

    @Mapping(source = "creator.id", target = "creatorId")
    ChannelResponse toResponse(Channel entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    void updateEntityFromRequest(ChannelRequest request, @MappingTarget Channel entity);
}
