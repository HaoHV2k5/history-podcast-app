package com.prm.wallet.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.User;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bank_accounts")
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "bank_name")
    private String bankName;
    @Column(name = "account_number")
    private String accountNumber;
    @Column(name = "account_holder_name")
    private String accountHolderName;
    @Column(name = "verified")
    private Boolean verified;
    @Column(name = "created_at")
    private Instant createdAt;
}
