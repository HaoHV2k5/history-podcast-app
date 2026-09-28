package com.prm.channel.repository;

import com.prm.channel.entity.Channel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    boolean existsByCreatorId(Long creatorId);

    Optional<Channel> findByCreatorId(Long creatorId);

    @Query("SELECT c FROM Channel c WHERE c.creator.email = :email")
    Optional<Channel> findByCreatorEmail(@Param("email") String email);

    Page<Channel> findAllByStatus(String status, Pageable pageable);
}
