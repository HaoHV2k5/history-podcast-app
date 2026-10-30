package com.prm.contract.repository;

import com.prm.contract.constant.MilestoneStatus;
import com.prm.contract.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByContractIdOrderByOrderNoAsc(Long contractId);

    Optional<Milestone> findByContractIdAndOrderNo(Long contractId, Integer orderNo);

    List<Milestone> findByStatusAndFundDueAtBefore(MilestoneStatus status, Instant now);

    List<Milestone> findByStatusAndReviewDueAtBefore(MilestoneStatus status, Instant now);

    @Query("SELECT m FROM Milestone m WHERE m.status = 'APPROVED' " +
           "AND m.releaseAt <= :now " +
           "AND NOT EXISTS (SELECT d FROM Dispute d WHERE d.milestone.id = m.id AND d.status = 'OPEN')")
    List<Milestone> findApprovedMilestonesReadyForRelease(@Param("now") Instant now);

    // --- 1. Consolidated KPI Summary Query (9 metrics in 1 single DB round-trip) ---
    @Query("SELECT " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED AND m.releasedAt >= :startDate AND m.releasedAt <= :endDate THEN m.platformFee ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus IN (com.prm.contract.constant.EscrowStatus.HELD, com.prm.contract.constant.EscrowStatus.FROZEN) AND m.fundedAt >= :startDate AND m.fundedAt <= :endDate THEN m.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus IN (com.prm.contract.constant.EscrowStatus.HELD, com.prm.contract.constant.EscrowStatus.FROZEN) AND m.fundedAt >= :startDate AND m.fundedAt <= :endDate THEN m.platformFee ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.fundedAt >= :startDate AND m.fundedAt <= :endDate THEN m.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.REFUNDED AND m.refundedAt >= :startDate AND m.refundedAt <= :endDate THEN m.amount ELSE 0 END), 0), " +
           "COUNT(CASE WHEN m.createdAt >= :startDate AND m.createdAt <= :endDate THEN m.id END), " +
           "COUNT(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED AND m.releasedAt >= :startDate AND m.releasedAt <= :endDate THEN m.id END), " +
           "COUNT(CASE WHEN m.escrowStatus IN (com.prm.contract.constant.EscrowStatus.HELD, com.prm.contract.constant.EscrowStatus.FROZEN) AND m.fundedAt >= :startDate AND m.fundedAt <= :endDate THEN m.id END), " +
           "COUNT(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.REFUNDED AND m.refundedAt >= :startDate AND m.refundedAt <= :endDate THEN m.id END) " +
           "FROM Milestone m")
    Object[] getRevenueSummaryAggregate(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    // --- 2. Chart Data ---
    @Query("SELECT m FROM Milestone m " +
           "JOIN FETCH m.contract c " +
           "WHERE m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED " +
           "AND m.releasedAt >= :startDate AND m.releasedAt <= :endDate " +
           "ORDER BY m.releasedAt ASC")
    List<Milestone> findReleasedMilestonesForChart(
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate
    );

    // --- 3. Unified Ledger & Export Query ---
    @Query(value = "SELECT m FROM Milestone m " +
                   "LEFT JOIN FETCH m.contract c " +
                   "LEFT JOIN FETCH c.creator cr " +
                   "LEFT JOIN FETCH c.freelancer fl " +
                   "WHERE (:contractId IS NULL OR c.id = :contractId) " +
                   "AND (:status IS NULL OR m.escrowStatus = :status) " +
                   "AND (:serviceType IS NULL OR c.serviceType = :serviceType) " +
                   "AND (" +
                   "   (m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED AND m.releasedAt >= :startDate AND m.releasedAt <= :endDate) OR " +
                   "   (m.escrowStatus != com.prm.contract.constant.EscrowStatus.RELEASED AND m.fundedAt >= :startDate AND m.fundedAt <= :endDate)" +
                   ") " +
                   "AND (CAST(:search AS string) IS NULL OR CAST(:search AS string) = '' OR (" +
                   "   LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                   "   LOWER(m.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                   "   LOWER(cr.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                   "   LOWER(cr.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                   "   LOWER(fl.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                   "   LOWER(fl.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))" +
                   "))",
           countQuery = "SELECT COUNT(m) FROM Milestone m " +
                        "JOIN m.contract c " +
                        "LEFT JOIN c.creator cr " +
                        "LEFT JOIN c.freelancer fl " +
                        "WHERE (:contractId IS NULL OR c.id = :contractId) " +
                        "AND (:status IS NULL OR m.escrowStatus = :status) " +
                        "AND (:serviceType IS NULL OR c.serviceType = :serviceType) " +
                        "AND (" +
                        "   (m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED AND m.releasedAt >= :startDate AND m.releasedAt <= :endDate) OR " +
                        "   (m.escrowStatus != com.prm.contract.constant.EscrowStatus.RELEASED AND m.fundedAt >= :startDate AND m.fundedAt <= :endDate)" +
                        ") " +
                        "AND (CAST(:search AS string) IS NULL OR CAST(:search AS string) = '' OR (" +
                        "   LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                        "   LOWER(m.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                        "   LOWER(cr.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                        "   LOWER(cr.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                        "   LOWER(fl.fullName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
                        "   LOWER(fl.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))" +
                        "))")
    org.springframework.data.domain.Page<Milestone> findLedgerWithFilters(
            @Param("contractId") Long contractId,
            @Param("status") com.prm.contract.constant.EscrowStatus status,
            @Param("serviceType") com.prm.contract.constant.ServiceType serviceType,
            @Param("startDate") Instant startDate,
            @Param("endDate") Instant endDate,
            @Param("search") String search,
            org.springframework.data.domain.Pageable pageable
    );

    // --- 4. Top Contributors ---
    @Query("SELECT c.creator.id, c.creator.fullName, c.creator.email, c.creator.avatarUrl, " +
           "SUM(m.amount), SUM(m.platformFee), COUNT(m.id) " +
           "FROM Milestone m " +
           "JOIN m.contract c " +
           "WHERE m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED " +
           "GROUP BY c.creator.id, c.creator.fullName, c.creator.email, c.creator.avatarUrl " +
           "ORDER BY SUM(m.platformFee) DESC")
    List<Object[]> findTopCreators(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT c.freelancer.id, c.freelancer.fullName, c.freelancer.email, c.freelancer.avatarUrl, " +
           "SUM(m.amount), SUM(m.platformFee), COUNT(m.id) " +
           "FROM Milestone m " +
           "JOIN m.contract c " +
           "WHERE m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED " +
           "GROUP BY c.freelancer.id, c.freelancer.fullName, c.freelancer.email, c.freelancer.avatarUrl " +
           "ORDER BY SUM(m.amount) DESC")
    List<Object[]> findTopFreelancers(org.springframework.data.domain.Pageable pageable);

    // --- 5. Consolidated User Personal Financials (Reversed Flow: Creator earns 95% netAmount, Requester spends 100% amount) ---
    @Query("SELECT " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED THEN m.netAmount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus IN (com.prm.contract.constant.EscrowStatus.HELD, com.prm.contract.constant.EscrowStatus.FROZEN) THEN m.netAmount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED THEN m.platformFee ELSE 0 END), 0) " +
           "FROM Milestone m " +
           "JOIN m.contract c " +
           "WHERE c.creator.id = :creatorId")
    Object[] getCreatorEarnedFinancials(@Param("creatorId") Long creatorId);

    @Query("SELECT " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.RELEASED THEN m.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus IN (com.prm.contract.constant.EscrowStatus.HELD, com.prm.contract.constant.EscrowStatus.FROZEN) THEN m.amount ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN m.escrowStatus = com.prm.contract.constant.EscrowStatus.REFUNDED THEN m.amount ELSE 0 END), 0) " +
           "FROM Milestone m " +
           "JOIN m.contract c " +
           "WHERE c.freelancer.id = :requesterId")
    Object[] getRequesterSpentFinancials(@Param("requesterId") Long requesterId);

    // --- 6. My Milestones by User ---
    @Query(value = "SELECT m FROM Milestone m JOIN FETCH m.contract c " +
           "WHERE (c.creator.id = :userId OR c.freelancer.id = :userId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:contractId IS NULL OR c.id = :contractId)",
           countQuery = "SELECT COUNT(m) FROM Milestone m JOIN m.contract c " +
           "WHERE (c.creator.id = :userId OR c.freelancer.id = :userId) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:contractId IS NULL OR c.id = :contractId)")
    org.springframework.data.domain.Page<Milestone> findMyMilestones(
            @Param("userId") Long userId,
            @Param("status") MilestoneStatus status,
            @Param("contractId") Long contractId,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT COUNT(m) FROM Milestone m JOIN m.contract c " +
           "WHERE (c.creator.id = :userId OR c.freelancer.id = :userId) " +
           "AND m.status = com.prm.contract.constant.MilestoneStatus.RELEASED")
    Long countMyCompletedMilestones(@Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM Milestone m JOIN m.contract c " +
           "WHERE (c.creator.id = :userId OR c.freelancer.id = :userId) " +
           "AND m.status IN (com.prm.contract.constant.MilestoneStatus.UNFUNDED, com.prm.contract.constant.MilestoneStatus.IN_PROGRESS, com.prm.contract.constant.MilestoneStatus.SUBMITTED, com.prm.contract.constant.MilestoneStatus.APPROVED)")
    Long countMyActiveMilestones(@Param("userId") Long userId);
}
