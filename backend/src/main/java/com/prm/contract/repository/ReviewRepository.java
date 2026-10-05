package com.prm.contract.repository;

import com.prm.contract.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByContractId(Long contractId);

    boolean existsByContractIdAndReviewerId(Long contractId, Long reviewerId);

    Page<Review> findByRevieweeId(Long revieweeId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double getAverageRatingByUserId(@Param("userId") Long userId);

    Long countByRevieweeId(Long userId);
}
