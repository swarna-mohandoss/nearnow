package com.nearnow.nearnow.service;


import com.nearnow.nearnow.model.*;
import com.nearnow.nearnow.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Event> getAllEvents() {
        return eventRepository.findByExpiredFalse();
    }

    public Event createEvent(Event event) {
        Event saved = eventRepository.save(event);
        messagingTemplate.convertAndSend("/topic/events", saved);
        return saved;
    }
    
    public List<Event> getAllEventsIncludingExpired() {
        return eventRepository.findAll();
    }
    
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}
