package com.prm.identity.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.identity.entity.Role;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    public Set<Role> getRoles() {
        if (roles == null) {
            roles = new HashSet<>();
        }
        if (roles.isEmpty() && role != null) {
            roles.add(role);
        }
        return roles;
    }

    public void addRole(Role role) {
        if (role == null) return;
        getRoles().add(role);
        if (this.role == null) {
            this.role = role;
        }
    }

    public void removeRole(Role role) {
        if (role == null) return;
        getRoles().remove(role);
        if (this.role != null && this.role.equals(role)) {
            this.role = roles.isEmpty() ? null : roles.iterator().next();
        }
    }

    public boolean hasRole(String roleName) {
        if (roleName == null) return false;
        if (getRoles().stream().anyMatch(r -> roleName.equalsIgnoreCase(r.getName()))) {
            return true;
        }
        return role != null && roleName.equalsIgnoreCase(role.getName());
    }

    public void setRole(Role role) {
        this.role = role;
        if (role != null) {
            addRole(role);
        }
    }
    @Column(name = "email")
    private String email;
    @Column(name = "phone")
    private String phone;
    @Column(name = "password_hash")
    private String passwordHash;
    @Column(name = "full_name")
    private String fullName;

    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
