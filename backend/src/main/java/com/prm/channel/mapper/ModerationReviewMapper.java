package com.prm.channel.mapper;

import com.prm.channel.dto.request.ModerationReviewRequest;
import com.prm.channel.dto.response.ModerationReviewResponse;
import com.prm.channel.entity.ModerationReview;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ModerationReviewMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "moderator", ignore = true)
    ModerationReview toEntity(ModerationReviewRequest request);

    @Mapping(source = "artifact.id", target = "artifactId")
    @Mapping(source = "moderator.id", target = "moderatorId")
    ModerationReviewResponse toResponse(ModerationReview entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "moderator", ignore = true)
    void updateEntityFromRequest(ModerationReviewRequest request, @MappingTarget ModerationReview entity);
}
