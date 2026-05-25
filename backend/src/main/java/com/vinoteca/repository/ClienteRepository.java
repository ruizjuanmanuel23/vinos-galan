package com.vinoteca.repository;

import com.vinoteca.model.Cliente;
import com.vinoteca.model.DiaSemana;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByTelefono(String telefono);
    List<Cliente> findByNombreContainingIgnoreCaseOrTelefonoContaining(String nombre, String telefono);
    List<Cliente> findByDiaRepartoOrderByNombreAsc(DiaSemana dia);
}
