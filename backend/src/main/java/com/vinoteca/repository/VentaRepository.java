package com.vinoteca.repository;

import com.vinoteca.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    @Query("SELECT v FROM Venta v WHERE v.cliente.id = :clienteId ORDER BY v.fecha DESC")
    List<Venta> findByClienteIdOrderByFechaDesc(Long clienteId);
}
