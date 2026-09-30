package com.prm.wallet.mapper;

import com.prm.wallet.dto.request.WithdrawalRequest;
import com.prm.wallet.dto.response.WithdrawalResponse;
import com.prm.wallet.entity.Withdrawal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WithdrawalMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "wallet", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "requestedAt", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    @Mapping(target = "failureReason", ignore = true)
    Withdrawal toEntity(WithdrawalRequest request);

    @Mapping(source = "wallet.id", target = "walletId")
    @Mapping(source = "bankAccount.id", target = "bankAccountId")
    @Mapping(source = "bankAccount.bankName", target = "bankName")
    @Mapping(source = "bankAccount.accountNumber", target = "accountNumber")
    @Mapping(source = "bankAccount.accountHolderName", target = "accountHolderName")
    WithdrawalResponse toResponse(Withdrawal entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "wallet", ignore = true)
    @Mapping(target = "bankAccount", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "requestedAt", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    @Mapping(target = "failureReason", ignore = true)
    void updateEntityFromRequest(WithdrawalRequest request, @MappingTarget Withdrawal entity);
}
