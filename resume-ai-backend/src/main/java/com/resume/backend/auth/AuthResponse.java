package com.resume.backend.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String email;
    private Integer scanCount;
    private Boolean isPro;
    private Integer enhanceCount;
    private Integer exportCount;
    private String role;
}
