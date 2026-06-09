package com.alaya.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "pms_users")
public class User extends PanacheEntity {
    @Column(unique = true, nullable = false)
    public String email;

    @Column(nullable = false)
    public String password;

    public String name;
    
    public String role;

    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }
}
