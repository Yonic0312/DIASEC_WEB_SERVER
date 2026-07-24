package com.diasec.diasec_backend.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SiteSettingMapper {
    String selectValue(@Param("key") String key);

    int upsertValue(@Param("key") String key, @Param("value") String value);
}
