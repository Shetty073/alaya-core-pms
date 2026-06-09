package com.alaya.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "pms_sessions")
public class Session extends PanacheEntity {
    @Column(unique = true, nullable = false)
    public String token;

    @ManyToOne
    public User user;

    @Column(name = "expires_at", nullable = false)
    public LocalDateTime expiresAt;

    public static Session findByToken(String token) {
        return find("token", token).firstResult();
    }
}
