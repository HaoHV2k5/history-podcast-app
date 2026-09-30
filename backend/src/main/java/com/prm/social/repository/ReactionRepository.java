package com.prm.social.repository;

import com.prm.social.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    @Query("SELECT COUNT(r) FROM Reaction r WHERE r.artifact.id = :artifactId AND LOWER(r.type) = LOWER(:type)")
    long countByArtifactIdAndType(@Param("artifactId") Long artifactId, @Param("type") String type);

    @Query("SELECT COUNT(r) FROM Reaction r WHERE r.artifact.id = :artifactId")
    long countByArtifactId(@Param("artifactId") Long artifactId);
}
