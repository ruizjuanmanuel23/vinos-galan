package com.vinoteca.controller;

import com.vinoteca.model.Cliente;
import com.vinoteca.model.DiaSemana;
import com.vinoteca.service.ClienteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) { this.clienteService = clienteService; }

    @GetMapping
    public List<Cliente> listar(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) return clienteService.buscar(q);
        return clienteService.listarTodos();
    }

    @GetMapping("/dia/{dia}")
    public List<Cliente> porDia(@PathVariable String dia) {
        return clienteService.porDia(DiaSemana.valueOf(dia.toUpperCase()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> obtener(@PathVariable Long id) {
        return clienteService.buscarPorId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/telefono/{tel}")
    public ResponseEntity<Cliente> buscarTelefono(@PathVariable String tel) {
        return clienteService.buscarPorTelefono(tel).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Cliente crear(@RequestBody Cliente c) { return clienteService.guardar(c); }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> editar(@PathVariable Long id, @RequestBody Cliente datos) {
        return clienteService.buscarPorId(id).map(c -> {
            c.setNombre(datos.getNombre());
            c.setTelefono(datos.getTelefono());
            c.setDireccion(datos.getDireccion());
            c.setZona(datos.getZona());
            c.setDiaReparto(datos.getDiaReparto());
            c.setNotas(datos.getNotas());
            return ResponseEntity.ok(clienteService.guardar(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
