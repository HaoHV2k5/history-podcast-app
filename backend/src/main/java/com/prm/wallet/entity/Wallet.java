package com.prm.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.User;
import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "available_balance")
    private BigDecimal availableBalance;
    @Column(name = "pending_balance")
    private BigDecimal pendingBalance;
    @Column(name = "currency")
    private String currency;
    @Column(name = "updated_at")
    private Instant updatedAt;
}
