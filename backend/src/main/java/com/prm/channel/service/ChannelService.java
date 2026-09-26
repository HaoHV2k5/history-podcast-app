package com.prm.channel.service;

import com.prm.channel.dto.request.ChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;

import java.util.List;

public interface ChannelService {
    List<ChannelResponse> findAll();
    ChannelResponse findById(Long id);
    ChannelResponse create(ChannelRequest request);
    ChannelResponse update(Long id, ChannelRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Channel
}
