package com.prm.contract.repository;

import com.prm.contract.entity.BookingEscrowConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingEscrowConfigRepository extends JpaRepository<BookingEscrowConfig, Long> {

    Optional<BookingEscrowConfig> findByConfigKey(String configKey);
}
