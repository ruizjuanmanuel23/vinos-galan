package com.vinoteca.repository;

import com.vinoteca.model.Viaje;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ViajeRepository extends JpaRepository<Viaje, Long> {
    List<Viaje> findAllByOrderByFechaDescIdDesc();
    List<Viaje> findByFechaOrderByIdDesc(LocalDate fecha);
}
