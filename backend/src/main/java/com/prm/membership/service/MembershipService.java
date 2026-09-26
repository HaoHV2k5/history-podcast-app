package com.prm.membership.service;

import com.prm.membership.dto.request.MembershipRequest;
import com.prm.membership.dto.response.MembershipResponse;

import java.util.List;

public interface MembershipService {
    List<MembershipResponse> findAll();
    MembershipResponse findById(Long id);
    MembershipResponse create(MembershipRequest request);
    MembershipResponse update(Long id, MembershipRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain Membership
}
