package com.vinoteca.dto;

public class DetalleVentaRequest {
    private Long vinoId;
    private Integer cantidad;

    public Long getVinoId() { return vinoId; }
    public void setVinoId(Long vinoId) { this.vinoId = vinoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}
