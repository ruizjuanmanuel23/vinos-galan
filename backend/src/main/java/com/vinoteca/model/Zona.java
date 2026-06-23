package com.vinoteca.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "zonas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Zona {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true)
  private String nombre;

  @Column(name = "ajuste_porcentaje")
  private Double ajustePorcentaje = 0.0;

  @Column(name = "orden")
  private Integer orden = 0;

  @Column(name = "creado_en", nullable = false, updatable = false)
  private String creadoEn;

  @PrePersist
  protected void onCreate() {
    creadoEn = java.time.Instant.now().toString();
  }
}
