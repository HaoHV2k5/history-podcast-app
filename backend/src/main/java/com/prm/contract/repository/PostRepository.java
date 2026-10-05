package com.prm.contract.repository;

import com.prm.contract.constant.PostStatus;
import com.prm.contract.constant.PostType;
import com.prm.contract.constant.ServiceType;
import com.prm.contract.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.status = 'OPEN' " +
           "AND (:type IS NULL OR p.type = :type) " +
           "AND (:serviceType IS NULL OR p.serviceType = :serviceType) " +
           "AND (:minPrice IS NULL OR p.referencePrice >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.referencePrice <= :maxPrice) " +
           "AND (:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchPosts(
            @Param("type") PostType type,
            @Param("serviceType") ServiceType serviceType,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    Page<Post> findByUserId(Long userId, Pageable pageable);

    List<Post> findByStatusAndExpiresAtBefore(PostStatus status, Instant now);
}
