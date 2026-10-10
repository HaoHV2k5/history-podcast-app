package com.prm.channel.repository;

import com.prm.channel.entity.SeriesItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeriesItemRepository extends JpaRepository<SeriesItem, Long> {

    List<SeriesItem> findBySeriesIdOrderByOrderNoAsc(Long seriesId);

    Optional<SeriesItem> findBySeriesIdAndContentId(Long seriesId, Long contentId);

    boolean existsBySeriesIdAndContentId(Long seriesId, Long contentId);

    void deleteBySeriesIdAndContentId(Long seriesId, Long contentId);

    void deleteByContentId(Long contentId);

    @Query("SELECT COALESCE(MAX(si.orderNo), 0) FROM SeriesItem si WHERE si.series.id = :seriesId")
    Integer findMaxOrderNoBySeriesId(@Param("seriesId") Long seriesId);
}
