package com.prm.contract.service;

import com.prm.contract.dto.request.BookingEscrowConfigRequest;
import com.prm.contract.dto.response.BookingEscrowConfigResponse;

public interface BookingEscrowConfigService {

    BookingEscrowConfigResponse getConfig();

    BookingEscrowConfigResponse updateConfig(BookingEscrowConfigRequest request);

    BookingEscrowConfigResponse resetDefaultConfig();
}
