package com.prm.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.Role;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;
    @Column(name = "email")
    private String email;
    @Column(name = "phone")
    private String phone;
    @Column(name = "password_hash")
    private String passwordHash;
    @Column(name = "status")
    private String status;
    @Column(name = "created_at")
    private Instant createdAt;
}
