package com.vinoteca.repository;

import com.vinoteca.model.DeudaAnotacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeudaAnotacionRepository extends JpaRepository<DeudaAnotacion, Long> {
    List<DeudaAnotacion> findByClienteIdOrderByFechaDesc(Long clienteId);
}
