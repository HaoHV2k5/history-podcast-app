package com.prm.creator.entity;

import com.prm.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "creator_ai_settings")
public class CreatorAiSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "gemini_api_key")
    private String geminiApiKey;

    @Column(name = "elevenlabs_api_key")
    private String elevenlabsApiKey;

    @Column(name = "tts_engine")
    @Builder.Default
    private String ttsEngine = "edge-tts";

    @Column(name = "voice_name")
    @Builder.Default
    private String voiceName = "vi-VN-NamMinhNeural";

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
