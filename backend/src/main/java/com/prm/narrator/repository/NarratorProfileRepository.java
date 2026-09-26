package com.prm.narrator.repository;

import com.prm.narrator.entity.NarratorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NarratorProfileRepository extends JpaRepository<NarratorProfile, Long> {
}
