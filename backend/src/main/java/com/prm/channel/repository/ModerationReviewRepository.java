package com.prm.channel.repository;

import com.prm.channel.entity.ModerationReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ModerationReviewRepository extends JpaRepository<ModerationReview, Long> {

    Optional<ModerationReview> findTopByArtifactIdOrderByIdDesc(Long artifactId);

    @Query("SELECT r FROM ModerationReview r WHERE r.artifact.content.id = :contentId ORDER BY r.id DESC")
    Optional<ModerationReview> findTopByArtifactContentIdOrderByIdDesc(@Param("contentId") Long contentId);

    Page<ModerationReview> findByDecision(String decision, Pageable pageable);

    @Query("""
        SELECT r FROM ModerationReview r
        LEFT JOIN r.artifact a
        LEFT JOIN a.content c
        LEFT JOIN c.channel ch
        WHERE (:decision IS NULL OR UPPER(r.decision) = :decision)
          AND (:search IS NULL OR :search = ''
                             OR LOWER(COALESCE(c.title, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                             OR LOWER(COALESCE(ch.name, '')) LIKE LOWER(CONCAT('%', :search, '%')))
    """)
    Page<ModerationReview> searchReviews(
            @Param("decision") String decision,
            @Param("search") String search,
            Pageable pageable
    );
}
