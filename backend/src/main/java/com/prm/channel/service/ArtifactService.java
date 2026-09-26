package com.prm.channel.service;

import com.prm.channel.dto.request.ArtifactRequest;
import com.prm.channel.dto.response.ArtifactResponse;

import java.util.List;

public interface ArtifactService {
    List<ArtifactResponse> findAll();
    ArtifactResponse findById(Long id);
    ArtifactResponse create(ArtifactRequest request);
    ArtifactResponse update(Long id, ArtifactRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Artifact
}
