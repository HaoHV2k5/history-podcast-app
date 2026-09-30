package com.prm.creator.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Whiteboard Media Streaming", description = "Truyền phát trực tiếp video MP4 và tệp phụ đề SRT từ xưởng hoạt họa")
public class WhiteboardMediaController {

    @Value("${app.tool.url:http://localhost:8000}")
    private String toolUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Operation(summary = "Truyền phát video hoặc tải tệp kết xuất của job", description = "Proxy trực tiếp dữ liệu video MP4 hoặc phụ đề SRT từ engine sang trình duyệt")
    @GetMapping(value = {
            "/outputs/{jobId}/{fileName}",
            "/api/v1/creator/studio/outputs/{jobId}/{fileName}"
    })
    public ResponseEntity<Resource> streamMediaFile(
            @PathVariable String jobId,
            @PathVariable String fileName,
            @RequestHeader HttpHeaders requestHeaders
    ) {
        try {
            String targetUrl = toolUrl + "/outputs/" + jobId + "/" + fileName;

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .version(HttpClient.Version.HTTP_1_1)
                    .timeout(Duration.ofSeconds(60))
                    .GET();

            // Forward Range header if browser requests partial content for video seeking
            if (requestHeaders.containsKey(HttpHeaders.RANGE)) {
                reqBuilder.header(HttpHeaders.RANGE, requestHeaders.getFirst(HttpHeaders.RANGE));
            }

            HttpRequest httpRequest = reqBuilder.build();
            HttpResponse<InputStream> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() == 404) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders responseHeaders = new HttpHeaders();

            // Forward Content-Type
            response.headers().firstValue(HttpHeaders.CONTENT_TYPE).ifPresent(ct ->
                    responseHeaders.set(HttpHeaders.CONTENT_TYPE, ct)
            );
            if (!responseHeaders.containsKey(HttpHeaders.CONTENT_TYPE)) {
                if (fileName.endsWith(".mp4")) {
                    responseHeaders.setContentType(MediaType.valueOf("video/mp4"));
                } else if (fileName.endsWith(".mp3")) {
                    responseHeaders.setContentType(MediaType.valueOf("audio/mpeg"));
                } else if (fileName.endsWith(".srt")) {
                    responseHeaders.setContentType(MediaType.TEXT_PLAIN);
                } else {
                    responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                }
            }

            // Forward Accept-Ranges and Content-Range for video scrubbing / seeking
            response.headers().firstValue(HttpHeaders.ACCEPT_RANGES).ifPresent(ar ->
                    responseHeaders.set(HttpHeaders.ACCEPT_RANGES, ar)
            );
            response.headers().firstValue(HttpHeaders.CONTENT_RANGE).ifPresent(cr ->
                    responseHeaders.set(HttpHeaders.CONTENT_RANGE, cr)
            );
            response.headers().firstValue(HttpHeaders.CONTENT_LENGTH).ifPresent(cl -> {
                try {
                    responseHeaders.setContentLength(Long.parseLong(cl));
                } catch (NumberFormatException ignored) {}
            });

            // Set inline disposition for video playback, attachment for download
            responseHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"");

            HttpStatus status = HttpStatus.valueOf(response.statusCode());
            return new ResponseEntity<>(new InputStreamResource(response.body()), responseHeaders, status);

        } catch (Exception e) {
            log.error("Failed to stream whiteboard media file: jobId={}, file={}", jobId, fileName, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
