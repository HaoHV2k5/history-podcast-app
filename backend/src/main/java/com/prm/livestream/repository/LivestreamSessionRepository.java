package com.prm.livestream.repository;

import com.prm.livestream.constant.LivestreamStatus;
import com.prm.livestream.entity.LivestreamSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LivestreamSessionRepository extends JpaRepository<LivestreamSession, Long> {

    Page<LivestreamSession> findByStatus(LivestreamStatus status, Pageable pageable);

    Page<LivestreamSession> findByChannelId(Long channelId, Pageable pageable);

    Page<LivestreamSession> findByChannelIdAndStatus(Long channelId, LivestreamStatus status, Pageable pageable);

    Optional<LivestreamSession> findByAgoraChannelName(String agoraChannelName);

    Optional<LivestreamSession> findByIdAndCreatorId(Long id, Long creatorId);
}
