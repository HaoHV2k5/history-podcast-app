package com.prm.channel.repository;

import com.prm.channel.entity.AiFilterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiFilterLogRepository extends JpaRepository<AiFilterLog, Long> {
}
