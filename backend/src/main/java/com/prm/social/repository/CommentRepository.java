package com.prm.social.repository;

import com.prm.social.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.artifact.id = :artifactId")
    long countByArtifactId(@Param("artifactId") Long artifactId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.user WHERE c.artifact.id = :artifactId ORDER BY c.createdAt DESC")
    List<Comment> findByArtifactIdWithUser(@Param("artifactId") Long artifactId);
}
