package com.vinoteca.service;

import com.vinoteca.dto.ViajeRequest;
import com.vinoteca.model.*;
import com.vinoteca.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ViajeService {
    private final ViajeRepository viajeRepository;
    private final ParadaRepository paradaRepository;
    private final ClienteRepository clienteRepository;

    public ViajeService(ViajeRepository viajeRepository, ParadaRepository paradaRepository, ClienteRepository clienteRepository) {
        this.viajeRepository = viajeRepository;
        this.paradaRepository = paradaRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Viaje> listarTodos() { return viajeRepository.findAllByOrderByFechaDescIdDesc(); }

    public Optional<Viaje> buscarPorId(Long id) { return viajeRepository.findById(id); }

    @Transactional
    public Viaje crear(ViajeRequest req) {
        Viaje v = new Viaje();
        v.setFecha(req.getFecha());
        v.setTitulo(req.getTitulo());
        v.setNotas(req.getNotas());
        v.setEstado(Viaje.Estado.EN_CURSO);

        if (req.getClienteIds() != null) {
            int orden = 1;
            for (Long cId : req.getClienteIds()) {
                Cliente c = clienteRepository.findById(cId).orElse(null);
                if (c == null) continue;
                Parada p = new Parada();
                p.setViaje(v);
                p.setCliente(c);
                p.setOrden(orden++);
                p.setEstado(Parada.Estado.PENDIENTE);
                v.getParadas().add(p);
            }
        }
        return viajeRepository.save(v);
    }

    @Transactional
    public Optional<Viaje> finalizar(Long id) {
        return viajeRepository.findById(id).map(v -> {
            v.setEstado(Viaje.Estado.FINALIZADO);
            v.setFin(LocalDateTime.now());
            return viajeRepository.save(v);
        });
    }

    @Transactional
    public Optional<Viaje> editar(Long id, ViajeRequest req) {
        return viajeRepository.findById(id).map(v -> {
            if (req.getTitulo() != null) v.setTitulo(req.getTitulo());
            if (req.getNotas() != null)  v.setNotas(req.getNotas());
            if (req.getFecha() != null)  v.setFecha(req.getFecha());
            return viajeRepository.save(v);
        });
    }

    public void eliminar(Long id) { viajeRepository.deleteById(id); }

    @Transactional
    public Optional<Parada> actualizarParada(Long paradaId, String nuevoEstado, String notas, Integer orden) {
        return paradaRepository.findById(paradaId).map(p -> {
            if (nuevoEstado != null) {
                Parada.Estado est = Parada.Estado.valueOf(nuevoEstado);
                p.setEstado(est);
                if (est == Parada.Estado.VISITADA && p.getHoraVisita() == null) {
                    p.setHoraVisita(LocalDateTime.now());
                }
                if (est == Parada.Estado.PENDIENTE) {
                    p.setHoraVisita(null);
                }
            }
            if (notas != null) p.setNotas(notas);
            if (orden != null) p.setOrden(orden);
            return paradaRepository.save(p);
        });
    }

    @Transactional
    public Optional<Parada> agregarParada(Long viajeId, Long clienteId) {
        return viajeRepository.findById(viajeId).flatMap(v ->
            clienteRepository.findById(clienteId).map(c -> {
                int nuevoOrden = v.getParadas().stream().mapToInt(Parada::getOrden).max().orElse(0) + 1;
                Parada p = new Parada();
                p.setViaje(v);
                p.setCliente(c);
                p.setOrden(nuevoOrden);
                p.setEstado(Parada.Estado.PENDIENTE);
                return paradaRepository.save(p);
            })
        );
    }

    public void eliminarParada(Long paradaId) { paradaRepository.deleteById(paradaId); }
}
