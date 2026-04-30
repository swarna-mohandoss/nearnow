package com.nearnow.nearnow.repository;

import com.nearnow.nearnow.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByExpiredFalse();

    @Query("SELECT e FROM Event e WHERE e.expiresAt < :now AND e.expired = false")
    List<Event> findExpiredEvents(LocalDateTime now);
}