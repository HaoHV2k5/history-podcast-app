package com.prm.channel.repository;

import com.prm.channel.entity.ModerationReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModerationReviewRepository extends JpaRepository<ModerationReview, Long> {
}
