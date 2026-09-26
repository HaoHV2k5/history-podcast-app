package com.prm.social.mapper;

import com.prm.social.dto.request.ReactionRequest;
import com.prm.social.dto.response.ReactionResponse;
import com.prm.social.entity.Reaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ReactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "user", ignore = true)
    Reaction toEntity(ReactionRequest request);

    @Mapping(source = "artifact.id", target = "artifactId")
    @Mapping(source = "user.id", target = "userId")
    ReactionResponse toResponse(Reaction entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(ReactionRequest request, @MappingTarget Reaction entity);
}
