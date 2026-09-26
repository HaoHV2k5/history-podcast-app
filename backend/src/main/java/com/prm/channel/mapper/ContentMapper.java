package com.prm.channel.mapper;

import com.prm.channel.dto.request.ContentRequest;
import com.prm.channel.dto.response.ContentResponse;
import com.prm.channel.entity.Content;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ContentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "channel", ignore = true)
    Content toEntity(ContentRequest request);

    @Mapping(source = "channel.id", target = "channelId")
    ContentResponse toResponse(Content entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "channel", ignore = true)
    void updateEntityFromRequest(ContentRequest request, @MappingTarget Content entity);
}
