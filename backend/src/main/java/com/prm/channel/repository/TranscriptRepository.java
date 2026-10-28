package com.prm.channel.repository;

import com.prm.channel.entity.Transcript;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TranscriptRepository extends JpaRepository<Transcript, Long> {
    Optional<Transcript> findFirstByArtifactIdOrderByCreatedAtDesc(Long artifactId);
}
