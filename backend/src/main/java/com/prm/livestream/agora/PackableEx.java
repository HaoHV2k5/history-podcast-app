package com.prm.livestream.agora;

public interface PackableEx extends Packable {
    void unmarshal(ByteBuf in);
}
