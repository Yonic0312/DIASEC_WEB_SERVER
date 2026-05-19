package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.DeliveryAddressMapper;
import com.diasec.diasec_backend.vo.DeliveryAddressVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // @Autowired 대신 사용하는 실무 표준
public class DeliveryAddressService {
    
    private final DeliveryAddressMapper mapper;

    public List<DeliveryAddressVo> getAddressList(String id) {
        return mapper.selectAddressList(id);
    }

    public DeliveryAddressVo getOneAddress(Long cno) {
        return mapper.selectOneAddress(cno);
    }

    public void addAddress(DeliveryAddressVo address) {
        if (address.getIsDefault()) { // 만약 새로운 default가 들어오면
            mapper.resetDefaultAddress(address.getId()); // 모두 초기화
        }
        mapper.insertAddress(address);
    }

    public void updateAddress(DeliveryAddressVo address) {
        if (address.getIsDefault()) {
            mapper.resetDefaultAddress(address.getId());
        }
        mapper.updateAddress(address);
    }

    public void deleteAddress(Long cno) {
        mapper.deleteAddress(cno);
    }

    public void deleteAllAddressByMemberId (String id) {
        mapper.deleteAddressByMemberId(id);
    }
}
