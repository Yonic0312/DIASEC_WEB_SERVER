package com.diasec.diasec_backend.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.diasec.diasec_backend.vo.DeliveryAddressVo;

@Mapper
public interface DeliveryAddressMapper {
    List<DeliveryAddressVo> selectAddressList(String id);

    DeliveryAddressVo selectOneAddress(Long cno);

    DeliveryAddressVo selectDefaultAddress(String id);
    
    void insertAddress(DeliveryAddressVo address);

    void updateAddress(DeliveryAddressVo addressVo);

    void deleteAddress(Long cno);

    void deleteAddressByMemberId(String id);

    void resetDefaultAddress(String id);

    void setDefaultAddress(Long cno);
}
