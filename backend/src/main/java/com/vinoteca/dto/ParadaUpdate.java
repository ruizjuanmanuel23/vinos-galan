package com.vinoteca.dto;

public class ParadaUpdate {
    private String estado;   // PENDIENTE | VISITADA | OMITIDA
    private String notas;
    private Integer orden;

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
}
