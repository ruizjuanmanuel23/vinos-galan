package com.vinoteca.controller;

import com.vinoteca.model.Zona;
import com.vinoteca.service.ZonaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zonas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ZonaController {
  private final ZonaService zonaService;

  @GetMapping
  public ResponseEntity<List<Zona>> listar() {
    return ResponseEntity.ok(zonaService.listar());
  }

  @GetMapping("/{id}")
  public ResponseEntity<Zona> obtener(@PathVariable Long id) {
    return zonaService.obtener(id)
      .map(ResponseEntity::ok)
      .orElseReturn(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<Zona> crear(@RequestBody Zona zona) {
    return ResponseEntity.status(HttpStatus.CREATED).body(zonaService.crear(zona));
  }

  @PutMapping("/{id}")
  public ResponseEntity<Zona> actualizar(@PathVariable Long id, @RequestBody Zona zona) {
    return ResponseEntity.ok(zonaService.actualizar(id, zona));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> eliminar(@PathVariable Long id) {
    zonaService.eliminar(id);
    return ResponseEntity.noContent().build();
  }
}
