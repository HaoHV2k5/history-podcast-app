package com.prm.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "otp_code", nullable = false)
    private String otpCode;

    @Column(name = "reset_token")
    private String resetToken;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "verified")
    private Boolean verified;

    @Column(name = "used")
    private Boolean used;

    @Column(name = "created_at")
    private Instant createdAt;
}
