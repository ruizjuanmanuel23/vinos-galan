package com.vinoteca.controller;

import com.vinoteca.dto.DeudaAnotacionRequest;
import com.vinoteca.model.Cliente;
import com.vinoteca.model.DeudaAnotacion;
import com.vinoteca.repository.ClienteRepository;
import com.vinoteca.repository.DeudaAnotacionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/deudas")
public class DeudaAnotacionController {
    private final DeudaAnotacionRepository deudaRepo;
    private final ClienteRepository clienteRepo;

    public DeudaAnotacionController(DeudaAnotacionRepository deudaRepo, ClienteRepository clienteRepo) {
        this.deudaRepo = deudaRepo;
        this.clienteRepo = clienteRepo;
    }

    @GetMapping("/cliente/{clienteId}")
    public List<DeudaAnotacion> porCliente(@PathVariable Long clienteId) {
        return deudaRepo.findByClienteIdOrderByFechaDesc(clienteId);
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody DeudaAnotacionRequest req) {
        Cliente cliente = clienteRepo.findById(req.getClienteId()).orElse(null);
        if (cliente == null) return ResponseEntity.badRequest().body("Cliente no encontrado");
        DeudaAnotacion d = new DeudaAnotacion();
        d.setCliente(cliente);
        d.setDescripcion(req.getDescripcion());
        d.setMonto(req.getMonto());
        d.setFecha(req.getFecha());
        return ResponseEntity.ok(deudaRepo.save(d));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody DeudaAnotacionRequest req) {
        return deudaRepo.findById(id).map(d -> {
            d.setDescripcion(req.getDescripcion());
            d.setMonto(req.getMonto());
            d.setFecha(req.getFecha());
            return ResponseEntity.ok(deudaRepo.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        deudaRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
