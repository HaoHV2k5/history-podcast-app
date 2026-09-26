package com.prm.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.channel.entity.Channel;
import com.prm.identity.entity.User;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "hire_requests")
public class HireRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "narrator_id")
    private User narrator;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id")
    private Channel channel;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "proposed_price")
    private BigDecimal proposedPrice;
    @Column(name = "deadline")
    private LocalDate deadline;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
