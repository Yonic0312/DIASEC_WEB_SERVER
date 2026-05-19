package com.diasec.diasec_backend.dao;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;

import com.diasec.diasec_backend.vo.EventVo;

@Mapper
public interface EventMapper {
    List<EventVo> getEventsByStatus(String status);
    EventVo getEventById(int eventId);
    int insertEvent(EventVo event);
    int updateEvent(EventVo event);
    int deleteEvent(int eventId);
}
