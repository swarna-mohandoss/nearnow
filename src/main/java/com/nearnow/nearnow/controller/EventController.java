package com.nearnow.nearnow.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.nearnow.nearnow.config.WebSocketEventListener;
import com.nearnow.nearnow.model.*;
import com.nearnow.nearnow.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventService eventService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Event> getAllEvents() {
        return eventService.getAllEvents();
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventService.createEvent(event);
    }

    @MessageMapping("/addEvent")
    @SendTo("/topic/events")
    public Event handleWebSocketEvent(Event event) {
        return eventService.createEvent(event);
    }
    
    @GetMapping("/users/count")
    public Map<String, Integer> getUserCount() {
        return Map.of("count", WebSocketEventListener.getConnectedUsers());
    }
    
    @GetMapping("/all")
    public List<Event> getAllEventsIncludingExpired() {
        return eventService.getAllEventsIncludingExpired();
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        messagingTemplate.convertAndSend("/topic/deleted", (Object) Map.of("id", id));
        return ResponseEntity.ok(Map.of("message", "Event deleted"));
    }
}