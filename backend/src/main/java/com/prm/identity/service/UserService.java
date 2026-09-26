package com.prm.identity.service;

import com.prm.identity.dto.request.UserRequest;
import com.prm.identity.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> findAll();
    UserResponse findById(Long id);
    UserResponse create(UserRequest request);
    UserResponse update(Long id, UserRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain User
}
