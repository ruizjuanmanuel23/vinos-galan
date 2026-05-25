package com.vinoteca.dto;

import java.time.LocalDate;
import java.util.List;

public class ViajeRequest {
    private LocalDate fecha;
    private String titulo;
    private String notas;
    private List<Long> clienteIds;

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public List<Long> getClienteIds() { return clienteIds; }
    public void setClienteIds(List<Long> clienteIds) { this.clienteIds = clienteIds; }
}
