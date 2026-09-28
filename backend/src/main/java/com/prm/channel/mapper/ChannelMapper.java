package com.prm.channel.mapper;

import com.prm.channel.dto.request.CreateChannelRequest;
import com.prm.channel.dto.request.UpdateChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.channel.entity.Channel;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ChannelMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Channel toEntity(CreateChannelRequest request);

    @Mapping(source = "creator.id", target = "creatorId")
    ChannelResponse toResponse(Channel entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(UpdateChannelRequest request, @MappingTarget Channel entity);
}
