package com.prm.wallet.mapper;

import com.prm.wallet.dto.request.BankAccountRequest;
import com.prm.wallet.dto.response.BankAccountResponse;
import com.prm.wallet.entity.BankAccount;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BankAccountMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    BankAccount toEntity(BankAccountRequest request);

    @Mapping(source = "user.id", target = "userId")
    BankAccountResponse toResponse(BankAccount entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(BankAccountRequest request, @MappingTarget BankAccount entity);
}
