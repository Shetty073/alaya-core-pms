package com.alaya.resource;

import com.alaya.model.Session;
import com.alaya.model.User;
import com.alaya.security.Secured;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import java.time.LocalDateTime;
import java.util.UUID;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    public static class RegisterRequest {
        public String name;
        public String email;
        public String password;
        public String role;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class AuthResponse {
        public String token;
        public String name;
        public String email;
        public String role;

        public AuthResponse(String token, String name, String email, String role) {
            this.token = token;
            this.name = name;
            this.email = email;
            this.role = role;
        }
    }

    @POST
    @Path("/auth/register")
    @Transactional
    public Response register(RegisterRequest req) {
        if (req.email == null || req.email.isBlank() || req.password == null || req.password.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email and Password are required")
                    .build();
        }

        User existingUser = User.findByEmail(req.email);
        if (existingUser != null) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("User with this email already exists")
                    .build();
        }

        User user = new User();
        user.email = req.email.toLowerCase().trim();
        user.password = req.password;
        user.name = req.name;
        user.role = req.role != null ? req.role : "guest";
        user.persist();

        return Response.status(Response.Status.CREATED)
                .entity(user)
                .build();
    }

    @POST
    @Path("/auth/login")
    @Transactional
    public Response login(LoginRequest req) {
        if (req.email == null || req.password == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email and Password are required")
                    .build();
        }

        User user = User.findByEmail(req.email.toLowerCase().trim());
        if (user == null || !user.password.equals(req.password)) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("Invalid email or password")
                    .build();
        }

        String token = UUID.randomUUID().toString();
        
        Session session = new Session();
        session.token = token;
        session.user = user;
        session.expiresAt = LocalDateTime.now().plusHours(2);
        session.persist();

        return Response.ok(new AuthResponse(token, user.name, user.email, user.role)).build();
    }

    @GET
    @Path("/test")
    @Secured
    public Response test(@Context SecurityContext securityContext) {
        String email = securityContext.getUserPrincipal().getName();
        User user = User.findByEmail(email);
        String name = user != null ? user.name : "Guest";
        String role = user != null ? user.role : "unspecified";

        return Response.ok("{\"message\": \"Success! Secured REST Endpoint accessed successfully.\", \"user\": \"" + name + "\", \"email\": \"" + email + "\", \"role\": \"" + role + "\"}")
                .build();
    }
}
