package com.vinoteca.service;

import com.vinoteca.model.Zona;
import com.vinoteca.repository.ZonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ZonaService {
  private final ZonaRepository zonaRepository;

  public List<Zona> listar() {
    return zonaRepository.findAll();
  }

  public Optional<Zona> obtener(Long id) {
    return zonaRepository.findById(id);
  }

  public Zona crear(Zona zona) {
    return zonaRepository.save(zona);
  }

  public Zona actualizar(Long id, Zona zonaData) {
    return zonaRepository.findById(id).map(zona -> {
      if (zonaData.getNombre() != null) zona.setNombre(zonaData.getNombre());
      if (zonaData.getAjustePorcentaje() != null) zona.setAjustePorcentaje(zonaData.getAjustePorcentaje());
      if (zonaData.getOrden() != null) zona.setOrden(zonaData.getOrden());
      return zonaRepository.save(zona);
    }).orElseThrow(() -> new RuntimeException("Zona no encontrada"));
  }

  public void eliminar(Long id) {
    zonaRepository.deleteById(id);
  }
}
