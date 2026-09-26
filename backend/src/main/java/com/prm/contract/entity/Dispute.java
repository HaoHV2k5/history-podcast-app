package com.prm.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.contract.entity.Contract;
import com.prm.identity.entity.User;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raised_by")
    private User raisedByUser;
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    @Column(name = "status")
    private String status;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedByUser;
    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;
    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
