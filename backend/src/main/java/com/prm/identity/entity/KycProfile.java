package com.prm.identity.entity;

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
@Table(name = "kyc_profiles")
public class KycProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    @Column(name = "phone")
    private String phone;
    @Column(name = "otp_code")
    private String otpCode;
    @Column(name = "otp_verified_at")
    private Instant otpVerifiedAt;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
