package com.prm.membership.repository;

import com.prm.membership.entity.Membership;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {

    Optional<Membership> findByViewerIdAndChannelId(Long viewerId, Long channelId);

    Optional<Membership> findByViewerIdAndChannelIdAndStatus(Long viewerId, Long channelId, String status);

    boolean existsByViewerIdAndChannelIdAndStatusAndEndedAtAfter(Long viewerId, Long channelId, String status, Instant now);

    Page<Membership> findByViewerIdAndStatusAndEndedAtAfter(Long viewerId, String status, Instant now, Pageable pageable);
}
