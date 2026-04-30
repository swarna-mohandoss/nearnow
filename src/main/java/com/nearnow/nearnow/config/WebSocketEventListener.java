package com.nearnow.nearnow.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.atomic.AtomicInteger;

@Component
public class WebSocketEventListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final AtomicInteger connectedUsers = new AtomicInteger(0);

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        int count = connectedUsers.incrementAndGet();
        messagingTemplate.convertAndSend("/topic/users", (Object) count);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        int count = connectedUsers.decrementAndGet();
        messagingTemplate.convertAndSend("/topic/users", (Object) count);
    }

    public static int getConnectedUsers() {
        return connectedUsers.get();
    }
}