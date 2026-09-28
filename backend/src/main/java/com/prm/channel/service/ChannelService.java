package com.prm.channel.service;

import com.prm.channel.dto.request.CreateChannelRequest;
import com.prm.channel.dto.request.UpdateChannelRequest;
import com.prm.channel.dto.response.ChannelResponse;
import com.prm.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface ChannelService {

    /**
     * Create a new podcast channel for an approved Creator.
     */
    ChannelResponse createChannel(CreateChannelRequest request);

    /**
     * Get the channel belonging to the currently authenticated Creator.
     */
    ChannelResponse getMyChannel();

    /**
     * Get public channel details by ID.
     */
    ChannelResponse getChannelById(Long id);

    /**
     * List all public active channels with pagination.
     */
    PageResponse<ChannelResponse> getAllChannels(Pageable pageable);

    /**
     * Update channel metadata (only allowed for channel owner or admin).
     */
    ChannelResponse updateChannel(Long id, UpdateChannelRequest request);

    /**
     * Upload and update channel avatar directly to Cloudinary.
     */
    ChannelResponse uploadAvatar(MultipartFile file);

    /**
     * Upload and update channel cover banner directly to Cloudinary.
     */
    ChannelResponse uploadCover(MultipartFile file);
}
