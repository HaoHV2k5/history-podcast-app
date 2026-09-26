package com.prm.membership.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.membership.entity.Membership;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "membership_payments")
public class MembershipPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membership_id")
    private Membership membership;
    @Column(name = "amount")
    private BigDecimal amount;
    @Column(name = "commission_amount")
    private BigDecimal commissionAmount;
    @Column(name = "creator_earning")
    private BigDecimal creatorEarning;
    @Column(name = "status")
    private String status;
    @Column(name = "paid_at")
    private Instant paidAt;
}
