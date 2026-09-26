package com.prm.narrator.repository;

import com.prm.narrator.entity.NarratorDemo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NarratorDemoRepository extends JpaRepository<NarratorDemo, Long> {
}
