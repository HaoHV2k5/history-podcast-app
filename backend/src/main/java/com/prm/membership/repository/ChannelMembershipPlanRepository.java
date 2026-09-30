package com.prm.membership.repository;

import com.prm.membership.entity.ChannelMembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChannelMembershipPlanRepository extends JpaRepository<ChannelMembershipPlan, Long> {

    Optional<ChannelMembershipPlan> findByChannelId(Long channelId);

    Optional<ChannelMembershipPlan> findByChannelIdAndStatus(Long channelId, String status);

    boolean existsByChannelId(Long channelId);
}
