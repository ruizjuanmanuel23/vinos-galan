package com.vinoteca.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(unique = true)
    private String telefono;

    private String direccion;

    /** Zona/barrio para agrupar visualmente. */
    private String zona;

    /** Día de la semana en que se hace el reparto a este cliente. Null = sin día fijo. */
    @Enumerated(EnumType.STRING)
    @Column(name = "dia_reparto", length = 10)
    private DiaSemana diaReparto;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    @PrePersist
    public void prePersist() { this.creadoEn = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getZona() { return zona; }
    public void setZona(String zona) { this.zona = zona; }
    public DiaSemana getDiaReparto() { return diaReparto; }
    public void setDiaReparto(DiaSemana diaReparto) { this.diaReparto = diaReparto; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}
