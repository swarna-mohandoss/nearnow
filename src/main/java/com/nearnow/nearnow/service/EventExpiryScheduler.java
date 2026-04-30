package com.nearnow.nearnow.service;

import com.nearnow.nearnow.model.*;
import com.nearnow.nearnow.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class EventExpiryScheduler {

	@Autowired
	private EventRepository eventRepository;

	@Autowired
	private SimpMessagingTemplate messagingTemplate;

	// Runs every 5 minutes
	@Scheduled(fixedRate = 300000)
	public void expireOldEvents() {
		List<Event> expiredEvents = eventRepository.findExpiredEvents(LocalDateTime.now());
		for (Event event : expiredEvents) {
			event.setExpired(true);
			eventRepository.save(event);
			// Notify all connected clients to remove this pin
			messagingTemplate.convertAndSend("/topic/expired", (Object) Map.of("id", event.getId()));
		}
		if (!expiredEvents.isEmpty()) {
			System.out.println("Expired " + expiredEvents.size() + " events.");
		}
	}
}