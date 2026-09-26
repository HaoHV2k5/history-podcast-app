package com.prm.membership.service;

import com.prm.membership.dto.request.MembershipPaymentRequest;
import com.prm.membership.dto.response.MembershipPaymentResponse;

import java.util.List;

public interface MembershipPaymentService {
    List<MembershipPaymentResponse> findAll();
    MembershipPaymentResponse findById(Long id);
    MembershipPaymentResponse create(MembershipPaymentRequest request);
    MembershipPaymentResponse update(Long id, MembershipPaymentRequest request);
    void delete(Long id);

    // TODO: Bổ sung các phương thức nghiệp vụ đặc thù cho domain MembershipPayment
}
