package com.prm.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.contract.entity.HireRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hire_request_id")
    private HireRequest hireRequest;
    @Column(name = "terms_text", columnDefinition = "TEXT")
    private String termsText;
    @Column(name = "price")
    private BigDecimal price;
    @Column(name = "deadline")
    private LocalDate deadline;
    @Column(name = "status")
    private String status;
    @Column(name = "creator_signed_at")
    private Instant creatorSignedAt;
    @Column(name = "narrator_signed_at")
    private Instant narratorSignedAt;
    @Column(name = "created_at")
    private Instant createdAt;
}
