package com.prm.channel.service;

import com.prm.channel.dto.request.AddSeriesItemRequest;
import com.prm.channel.dto.request.CreateSeriesRequest;
import com.prm.channel.dto.request.ReorderSeriesItemsRequest;
import com.prm.channel.dto.request.UpdateSeriesRequest;
import com.prm.channel.dto.response.SeriesDetailResponse;
import com.prm.channel.dto.response.SeriesResponse;
import com.prm.channel.entity.Artifact;
import com.prm.channel.entity.Channel;
import com.prm.channel.entity.Content;
import com.prm.channel.entity.Series;
import com.prm.channel.entity.SeriesItem;
import com.prm.channel.repository.ArtifactRepository;
import com.prm.channel.repository.ChannelRepository;
import com.prm.channel.repository.ContentRepository;
import com.prm.channel.repository.SeriesItemRepository;
import com.prm.channel.repository.SeriesRepository;
import com.prm.channel.service.impl.SeriesServiceImpl;
import com.prm.common.exception.AppException;
import com.prm.common.exception.ErrorCode;
import com.prm.identity.entity.Role;
import com.prm.identity.entity.User;
import com.prm.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeriesServiceTest {

    @Mock
    private SeriesRepository seriesRepository;

    @Mock
    private SeriesItemRepository seriesItemRepository;

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private ContentRepository contentRepository;

    @Mock
    private ArtifactRepository artifactRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SeriesServiceImpl seriesService;

    private User creator;
    private Channel channel;
    private Content content1;
    private Content content2;
    private Series series;

    @BeforeEach
    void setUp() {
        creator = User.builder()
                .id(1L)
                .email("creator@example.com")
                .fullName("Sử Việt Creator")
                .roles(Set.of(Role.builder().name("CREATOR").build()))
                .build();

        channel = Channel.builder()
                .id(10L)
                .creator(creator)
                .name("Kênh Sử Hào Hùng")
                .avatarUrl("https://res.cloudinary.com/avatar.png")
                .build();

        content1 = Content.builder()
                .id(101L)
                .channel(channel)
                .title("Tập 1: Khởi nghĩa Lam Sơn")
                .textBody("Chi tiết tập 1")
                .status("PUBLISHED")
                .isExclusive(false)
                .build();

        content2 = Content.builder()
                .id(102L)
                .channel(channel)
                .title("Tập 2: Chiến thắng Tốt Động Chúc Động")
                .textBody("Chi tiết tập 2")
                .status("PUBLISHED")
                .isExclusive(false)
                .build();

        series = Series.builder()
                .id(50L)
                .channel(channel)
                .title("Khởi Nghĩa Lam Sơn Toàn Tập")
                .description("Tuyển tập lịch sử kháng Minh")
                .coverUrl("https://res.cloudinary.com/cover.png")
                .status("PUBLISHED")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("Tạo Series mới thành công kèm danh sách video ban đầu")
    void createSeries_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(channelRepository.findByCreatorId(creator.getId())).thenReturn(Optional.of(channel));
        when(seriesRepository.existsByChannelIdAndTitle(channel.getId(), "Khởi Nghĩa Lam Sơn Toàn Tập")).thenReturn(false);

        when(seriesRepository.save(any(Series.class))).thenAnswer(invocation -> {
            Series s = invocation.getArgument(0);
            s.setId(50L);
            return s;
        });

        when(contentRepository.findByIdAndCreatorId(101L, creator.getId())).thenReturn(Optional.of(content1));
        when(seriesItemRepository.existsBySeriesIdAndContentId(50L, 101L)).thenReturn(false);

        CreateSeriesRequest request = CreateSeriesRequest.builder()
                .title("Khởi Nghĩa Lam Sơn Toàn Tập")
                .description("Tuyển tập lịch sử kháng Minh")
                .coverUrl("https://res.cloudinary.com/cover.png")
                .contentIds(List.of(101L))
                .build();

        SeriesResponse response = seriesService.createSeries(creator.getEmail(), request);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals("Khởi Nghĩa Lam Sơn Toàn Tập", response.getTitle());
        verify(seriesItemRepository, times(1)).save(any(SeriesItem.class));
    }

    @Test
    @DisplayName("Tạo Series trùng tiêu đề ném exception SERIES_TITLE_EXISTS")
    void createSeries_duplicateTitle_throwsException() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(channelRepository.findByCreatorId(creator.getId())).thenReturn(Optional.of(channel));
        when(seriesRepository.existsByChannelIdAndTitle(channel.getId(), "Trùng Tiêu Đề")).thenReturn(true);

        CreateSeriesRequest request = CreateSeriesRequest.builder()
                .title("Trùng Tiêu Đề")
                .build();

        AppException ex = assertThrows(AppException.class, () -> seriesService.createSeries(creator.getEmail(), request));
        assertEquals(ErrorCode.SERIES_TITLE_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy danh sách Series của Creator")
    void getCreatorSeries_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(channelRepository.findByCreatorId(creator.getId())).thenReturn(Optional.of(channel));
        when(seriesRepository.findByChannelIdOrderByCreatedAtDesc(channel.getId())).thenReturn(List.of(series));
        when(seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(series.getId())).thenReturn(List.of());

        List<SeriesResponse> list = seriesService.getCreatorSeries(creator.getEmail());

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(series.getTitle(), list.get(0).getTitle());
    }

    @Test
    @DisplayName("Lấy chi tiết Series kèm các tập thành công")
    void getSeriesDetail_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(seriesRepository.findById(50L)).thenReturn(Optional.of(series));

        SeriesItem item1 = SeriesItem.builder().id(1L).series(series).content(content1).orderNo(1).build();
        SeriesItem item2 = SeriesItem.builder().id(2L).series(series).content(content2).orderNo(2).build();
        when(seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(50L)).thenReturn(List.of(item1, item2));

        Artifact artifact = Artifact.builder().content(content1).type("VIDEO").durationSeconds(600).fileUrl("https://video1.mp4").build();
        when(artifactRepository.findByContentId(101L)).thenReturn(List.of(artifact));
        when(artifactRepository.findByContentId(102L)).thenReturn(List.of());

        SeriesDetailResponse detail = seriesService.getSeriesDetail(creator.getEmail(), 50L);

        assertNotNull(detail);
        assertEquals(2, detail.getItemCount());
        assertEquals(2, detail.getItems().size());
        assertEquals(1, detail.getItems().get(0).getOrderNo());
        assertEquals(600, detail.getTotalDurationSeconds());
    }

    @Test
    @DisplayName("Thêm video vào Series thành công")
    void addSeriesItem_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(seriesRepository.findById(50L)).thenReturn(Optional.of(series));
        when(contentRepository.findByIdAndCreatorId(102L, creator.getId())).thenReturn(Optional.of(content2));
        when(seriesItemRepository.existsBySeriesIdAndContentId(50L, 102L)).thenReturn(false);
        when(seriesItemRepository.findMaxOrderNoBySeriesId(50L)).thenReturn(1);

        AddSeriesItemRequest req = AddSeriesItemRequest.builder().contentId(102L).build();
        seriesService.addSeriesItem(creator.getEmail(), 50L, req);

        verify(seriesItemRepository, times(1)).save(any(SeriesItem.class));
    }

    @Test
    @DisplayName("Gỡ video khỏi Series và tự động đánh lại số thứ tự")
    void removeSeriesItem_reordersRemaining() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(seriesRepository.findById(50L)).thenReturn(Optional.of(series));

        SeriesItem item2 = SeriesItem.builder().id(2L).series(series).content(content2).orderNo(2).build();
        when(seriesItemRepository.findBySeriesIdOrderByOrderNoAsc(50L)).thenReturn(List.of(item2));

        seriesService.removeSeriesItem(creator.getEmail(), 50L, 101L);

        verify(seriesItemRepository, times(1)).deleteBySeriesIdAndContentId(50L, 101L);
        assertEquals(1, item2.getOrderNo());
        verify(seriesItemRepository, times(1)).save(item2);
    }

    @Test
    @DisplayName("Sắp xếp lại thứ tự các tập trong Series")
    void reorderSeriesItems_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(seriesRepository.findById(50L)).thenReturn(Optional.of(series));

        SeriesItem item1 = SeriesItem.builder().id(1L).series(series).content(content1).orderNo(1).build();
        SeriesItem item2 = SeriesItem.builder().id(2L).series(series).content(content2).orderNo(2).build();

        when(seriesItemRepository.findBySeriesIdAndContentId(50L, 102L)).thenReturn(Optional.of(item2));
        when(seriesItemRepository.findBySeriesIdAndContentId(50L, 101L)).thenReturn(Optional.of(item1));

        ReorderSeriesItemsRequest req = ReorderSeriesItemsRequest.builder().contentIds(List.of(102L, 101L)).build();
        seriesService.reorderSeriesItems(creator.getEmail(), 50L, req);

        assertEquals(1, item2.getOrderNo());
        assertEquals(2, item1.getOrderNo());
        verify(seriesItemRepository, times(1)).save(item2);
        verify(seriesItemRepository, times(1)).save(item1);
    }

    @Test
    @DisplayName("Xóa Series thành công")
    void deleteSeries_success() {
        when(userRepository.findByEmail(creator.getEmail())).thenReturn(Optional.of(creator));
        when(seriesRepository.findById(50L)).thenReturn(Optional.of(series));

        seriesService.deleteSeries(creator.getEmail(), 50L);

        verify(seriesRepository, times(1)).delete(series);
    }
}
