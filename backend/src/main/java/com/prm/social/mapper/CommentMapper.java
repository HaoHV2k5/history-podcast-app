package com.prm.social.mapper;

import com.prm.social.dto.request.CommentRequest;
import com.prm.social.dto.response.CommentResponse;
import com.prm.social.entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parentComment", ignore = true)
    Comment toEntity(CommentRequest request);

    @Mapping(source = "artifact.id", target = "artifactId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "parentComment.id", target = "parentCommentId")
    CommentResponse toResponse(Comment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "artifact", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parentComment", ignore = true)
    void updateEntityFromRequest(CommentRequest request, @MappingTarget Comment entity);
}
