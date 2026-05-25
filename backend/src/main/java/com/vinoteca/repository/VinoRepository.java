package com.vinoteca.repository;

import com.vinoteca.model.Vino;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VinoRepository extends JpaRepository<Vino, Long> {
    List<Vino> findByActivoTrueOrderByNombreAsc();
    List<Vino> findAllByOrderByNombreAsc();
}
