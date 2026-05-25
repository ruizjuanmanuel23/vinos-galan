package com.vinoteca.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DeudaAnotacionRequest {
    private Long clienteId;
    private String descripcion;
    private BigDecimal monto;
    private LocalDate fecha;

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
}
