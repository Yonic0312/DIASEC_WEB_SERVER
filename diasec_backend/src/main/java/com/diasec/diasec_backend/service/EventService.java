package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.EventMapper;
import com.diasec.diasec_backend.vo.EventVo;

@Service
public class EventService {
    
    @Autowired
    private EventMapper eventMapper;

    public List<EventVo> getEventsByStatus(String status) {
        return eventMapper.getEventsByStatus(status);
    }

    public EventVo getEventById(int eventId) {
        return eventMapper.getEventById(eventId);
    }

    public void insertEvent(EventVo event) {
        eventMapper.insertEvent(event);
    }
    
    public void updateEvent(EventVo event) {
        eventMapper.updateEvent(event);
    }

    public void deleteEvent(int eventId) {
        eventMapper.deleteEvent(eventId);
    }
}

    
