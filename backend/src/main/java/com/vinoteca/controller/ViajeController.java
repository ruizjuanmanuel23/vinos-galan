package com.vinoteca.controller;

import com.vinoteca.dto.ParadaUpdate;
import com.vinoteca.dto.ViajeRequest;
import com.vinoteca.model.Parada;
import com.vinoteca.model.Viaje;
import com.vinoteca.service.ViajeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/viajes")
public class ViajeController {
    private final ViajeService viajeService;

    public ViajeController(ViajeService viajeService) { this.viajeService = viajeService; }

    @GetMapping
    public List<Viaje> listar() { return viajeService.listarTodos(); }

    @GetMapping("/{id}")
    public ResponseEntity<Viaje> obtener(@PathVariable Long id) {
        return viajeService.buscarPorId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Viaje crear(@RequestBody ViajeRequest req) { return viajeService.crear(req); }

    @PutMapping("/{id}")
    public ResponseEntity<Viaje> editar(@PathVariable Long id, @RequestBody ViajeRequest req) {
        return viajeService.editar(id, req).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/finalizar")
    public ResponseEntity<Viaje> finalizar(@PathVariable Long id) {
        return viajeService.finalizar(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        viajeService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    // Paradas
    @PostMapping("/{viajeId}/paradas")
    public ResponseEntity<Parada> agregarParada(@PathVariable Long viajeId, @RequestBody Map<String, Long> body) {
        return viajeService.agregarParada(viajeId, body.get("clienteId"))
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/paradas/{paradaId}")
    public ResponseEntity<Parada> updateParada(@PathVariable Long paradaId, @RequestBody ParadaUpdate body) {
        return viajeService.actualizarParada(paradaId, body.getEstado(), body.getNotas(), body.getOrden())
                .map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/paradas/{paradaId}")
    public ResponseEntity<Void> eliminarParada(@PathVariable Long paradaId) {
        viajeService.eliminarParada(paradaId);
        return ResponseEntity.noContent().build();
    }
}
