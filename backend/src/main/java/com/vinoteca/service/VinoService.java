package com.vinoteca.service;

import com.vinoteca.model.Vino;
import com.vinoteca.repository.VinoRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class VinoService {
    private final VinoRepository vinoRepository;

    public VinoService(VinoRepository vinoRepository) {
        this.vinoRepository = vinoRepository;
    }

    public List<Vino> listarActivos() { return vinoRepository.findByActivoTrueOrderByNombreAsc(); }
    public List<Vino> listarTodos() { return vinoRepository.findAllByOrderByNombreAsc(); }
    public Optional<Vino> buscarPorId(Long id) { return vinoRepository.findById(id); }
    public Vino guardar(Vino v) { return vinoRepository.save(v); }
    public void desactivar(Long id) {
        vinoRepository.findById(id).ifPresent(v -> { v.setActivo(false); vinoRepository.save(v); });
    }
}
