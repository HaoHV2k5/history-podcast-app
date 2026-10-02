package com.prm.channel.repository;

import com.prm.channel.entity.AiFilterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiFilterLogRepository extends JpaRepository<AiFilterLog, Long> {

    Optional<AiFilterLog> findTopByArtifactIdOrderByIdDesc(Long artifactId);

    @Query("SELECT l FROM AiFilterLog l WHERE l.artifact.content.id = :contentId ORDER BY l.id DESC")
    Optional<AiFilterLog> findTopByArtifactContentIdOrderByIdDesc(@Param("contentId") Long contentId);
}
