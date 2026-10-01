package com.prm.channel.repository;

import com.prm.channel.entity.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {

    @Query("SELECT c FROM Content c WHERE c.channel.creator.id = :creatorId ORDER BY c.createdAt DESC")
    List<Content> findByCreatorId(@Param("creatorId") Long creatorId);

    @Query("SELECT c FROM Content c WHERE c.id = :contentId AND c.channel.creator.id = :creatorId")
    Optional<Content> findByIdAndCreatorId(@Param("contentId") Long contentId, @Param("creatorId") Long creatorId);

    @Query("SELECT c FROM Content c WHERE c.status = :status ORDER BY c.createdAt DESC")
    List<Content> findByStatus(@Param("status") String status);

    @Query("SELECT c FROM Content c WHERE c.channel.id = :channelId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Content> findByChannelIdAndStatus(@Param("channelId") Long channelId, @Param("status") String status);
}
