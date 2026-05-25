package com.vinoteca.controller;

import com.vinoteca.model.Vino;
import com.vinoteca.service.VinoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vinos")
public class VinoController {
    private final VinoService vinoService;

    public VinoController(VinoService vinoService) { this.vinoService = vinoService; }

    @GetMapping
    public List<Vino> catalogo() { return vinoService.listarActivos(); }

    @GetMapping("/admin")
    public List<Vino> todos() { return vinoService.listarTodos(); }

    @PostMapping
    public Vino crear(@RequestBody Vino v) { return vinoService.guardar(v); }

    @PutMapping("/{id}")
    public ResponseEntity<Vino> editar(@PathVariable Long id, @RequestBody Vino datos) {
        return vinoService.buscarPorId(id).map(v -> {
            v.setNombre(datos.getNombre());
            v.setBodega(datos.getBodega());
            v.setVarietal(datos.getVarietal());
            v.setPrecioVenta(datos.getPrecioVenta());
            v.setPrecioCosto(datos.getPrecioCosto());
            v.setStock(datos.getStock());
            if (datos.getActivo() != null) v.setActivo(datos.getActivo());
            return ResponseEntity.ok(vinoService.guardar(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        vinoService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
