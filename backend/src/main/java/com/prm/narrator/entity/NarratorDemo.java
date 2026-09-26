package com.prm.narrator.entity;

import jakarta.persistence.*;
import lombok.*;
import com.prm.narrator.entity.NarratorProfile;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "narrator_demos")
public class NarratorDemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "narrator_profile_id")
    private NarratorProfile narratorProfile;
    @Column(name = "title")
    private String title;
    @Column(name = "file_url")
    private String fileUrl;
    @Column(name = "uploaded_at")
    private Instant uploadedAt;
}
