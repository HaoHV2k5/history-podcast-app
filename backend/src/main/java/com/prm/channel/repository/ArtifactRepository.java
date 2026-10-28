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

    @Query("SELECT a FROM Artifact a WHERE a.content.id = :contentId AND a.type IN ('VIDEO', 'AUDIO') ORDER BY a.version DESC, a.createdAt DESC")
    List<Artifact> findMediaArtifactsByContentId(@Param("contentId") Long contentId);

    @Query("SELECT a FROM Artifact a WHERE a.content.id = :contentId AND a.type IN ('VIDEO', 'AUDIO') AND UPPER(a.status) = UPPER(:status) ORDER BY a.version DESC, a.createdAt DESC")
    List<Artifact> findMediaArtifactsByContentIdAndStatus(@Param("contentId") Long contentId, @Param("status") String status);

    @Query("SELECT a FROM Artifact a WHERE a.content.id = :contentId AND a.type IN ('VIDEO', 'AUDIO') AND UPPER(a.status) = 'PUBLISHED' ORDER BY a.version DESC, a.createdAt DESC")
    List<Artifact> findPublishedArtifacts(@Param("contentId") Long contentId);

    @Query("SELECT a FROM Artifact a WHERE a.content.id = :contentId AND (a.type = 'COVER' OR a.type = 'THUMBNAIL') ORDER BY a.version DESC, a.createdAt DESC")
    List<Artifact> findCoverArtifacts(@Param("contentId") Long contentId);

    default Optional<Artifact> findFirstByContentIdOrderByCreatedAtDesc(Long contentId) {
        List<Artifact> list = findMediaArtifactsByContentId(contentId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    default Optional<Artifact> findFirstByContentIdAndStatusOrderByCreatedAtDesc(Long contentId, String status) {
        List<Artifact> list = findMediaArtifactsByContentIdAndStatus(contentId, status);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    default Optional<Artifact> findPublishedOrLatest(Long contentId) {
        List<Artifact> published = findPublishedArtifacts(contentId);
        if (!published.isEmpty()) {
            return Optional.of(published.get(0));
        }
        return findFirstByContentIdOrderByCreatedAtDesc(contentId);
    }

    default Optional<Artifact> findLatestCoverArtifact(Long contentId) {
        List<Artifact> covers = findCoverArtifacts(contentId);
        return covers.isEmpty() ? Optional.empty() : Optional.of(covers.get(0));
    }
}
