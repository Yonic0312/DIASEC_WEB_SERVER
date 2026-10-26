package com.diasec.diasec_backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.EventMapper;
import com.diasec.diasec_backend.vo.EventVo;

import jakarta.transaction.Transactional;

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
        Integer min = eventMapper.selectMinSortOrder();
        event.setSortOrder(min == null ? 1 : min - 1);
        eventMapper.insertEvent(event);
    }

    @Transactional 
    public void updateEventOrder(List<EventVo> orders) {
        for (EventVo order : orders) {
            eventMapper.updateEventSortOrder(order.getEventId(), order.getSortOrder());
        }
    }
    
    public void updateEvent(EventVo event) {
        eventMapper.updateEvent(event);
    }

    public void deleteEvent(int eventId) {
        eventMapper.deleteEvent(eventId);
    }
}

    
