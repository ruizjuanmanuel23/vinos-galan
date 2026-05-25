package com.vinoteca.controller;

import com.vinoteca.dto.VentaRequest;
import com.vinoteca.model.Venta;
import com.vinoteca.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {
    private final VentaService ventaService;

    public VentaController(VentaService ventaService) { this.ventaService = ventaService; }

    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody VentaRequest req) {
        try {
            return ResponseEntity.ok(ventaService.registrarVenta(req));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Venta> porCliente(@PathVariable Long clienteId) {
        return ventaService.listarPorCliente(clienteId);
    }
}
