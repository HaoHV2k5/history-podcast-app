package com.prm.channel.repository;

import com.prm.channel.entity.Artifact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ArtifactRepository extends JpaRepository<Artifact, Long> {

    @Query("SELECT a FROM Artifact a WHERE a.content.id = :contentId ORDER BY a.createdAt DESC")
    List<Artifact> findByContentId(@Param("contentId") Long contentId);

    Optional<Artifact> findFirstByContentIdOrderByCreatedAtDesc(Long contentId);
}
