package com.prm.wallet.mapper;

import com.prm.wallet.dto.request.WalletRequest;
import com.prm.wallet.dto.response.WalletResponse;
import com.prm.wallet.entity.Wallet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface WalletMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    Wallet toEntity(WalletRequest request);

    @Mapping(source = "user.id", target = "userId")
    WalletResponse toResponse(Wallet entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    void updateEntityFromRequest(WalletRequest request, @MappingTarget Wallet entity);
}
