package com.prm.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.wallet.entity.Wallet;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wallet_transactions")
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;
    @Column(name = "type")
    private String type;
    @Column(name = "amount")
    private BigDecimal amount;
    @Column(name = "related_type")
    private String relatedType;
    @Column(name = "related_id")
    private Long relatedId;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
