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
    @Column(name = "merchant_txn_ref")
    private String merchantTxnRef;
    @Column(name = "gateway_txn_no")
    private String gatewayTxnNo;
    @Column(name = "gateway_provider")
    private String gatewayProvider;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (gatewayProvider == null) {
            gatewayProvider = "INTERNAL";
        }
    }
}
