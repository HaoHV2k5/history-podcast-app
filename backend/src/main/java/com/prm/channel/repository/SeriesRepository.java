package com.prm.channel.repository;

import com.prm.channel.entity.Series;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeriesRepository extends JpaRepository<Series, Long> {

    List<Series> findByChannelIdOrderByCreatedAtDesc(Long channelId);

    List<Series> findByChannelIdAndStatusOrderByCreatedAtDesc(Long channelId, String status);

    Optional<Series> findByIdAndChannelId(Long id, Long channelId);

    boolean existsByChannelIdAndTitle(Long channelId, String title);

    boolean existsByChannelIdAndTitleAndIdNot(Long channelId, String title, Long id);
}
