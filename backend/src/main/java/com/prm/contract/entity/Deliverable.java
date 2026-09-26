package com.prm.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.contract.entity.Contract;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "deliverables")
public class Deliverable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;
    @Column(name = "file_url")
    private String fileUrl;
    @Column(name = "status")
    private String status;
    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;
    @Column(name = "submitted_at")
    private Instant submittedAt;
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
