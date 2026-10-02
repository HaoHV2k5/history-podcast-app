package com.prm.identity.repository;

import com.prm.identity.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    @Query("SELECT u FROM User u WHERE " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:roleName IS NULL OR UPPER(u.role.name) = UPPER(:roleName)) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(u.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("roleName") String roleName,
                           @Param("status") String status,
                           Pageable pageable);
}
