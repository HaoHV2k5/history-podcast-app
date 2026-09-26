package com.prm.wallet.mapper;

import com.prm.wallet.dto.request.WalletTransactionRequest;
import com.prm.wallet.dto.response.WalletTransactionResponse;
import com.prm.wallet.entity.WalletTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WalletTransactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "wallet", ignore = true)
    WalletTransaction toEntity(WalletTransactionRequest request);

    @Mapping(source = "wallet.id", target = "walletId")
    WalletTransactionResponse toResponse(WalletTransaction entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "wallet", ignore = true)
    void updateEntityFromRequest(WalletTransactionRequest request, @MappingTarget WalletTransaction entity);
}
