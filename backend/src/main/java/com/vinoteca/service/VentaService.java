package com.vinoteca.service;

import com.vinoteca.dto.VentaRequest;
import com.vinoteca.model.*;
import com.vinoteca.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class VentaService {
    private final VentaRepository ventaRepository;
    private final ClienteRepository clienteRepository;
    private final VinoRepository vinoRepository;

    public VentaService(VentaRepository ventaRepository, ClienteRepository clienteRepository, VinoRepository vinoRepository) {
        this.ventaRepository = ventaRepository;
        this.clienteRepository = clienteRepository;
        this.vinoRepository = vinoRepository;
    }

    @Transactional
    public Venta registrarVenta(VentaRequest req) {
        Cliente cliente = clienteRepository.findById(req.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Venta venta = new Venta();
        venta.setCliente(cliente);
        venta.setNotas(req.getNotas());
        venta.setFecha(LocalDateTime.now());
        venta.setTotal(BigDecimal.ZERO);

        List<DetalleVenta> detalles = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (var item : req.getDetalles()) {
            Vino vino = vinoRepository.findById(item.getVinoId())
                    .orElseThrow(() -> new RuntimeException("Vino no encontrado: " + item.getVinoId()));
            if (vino.getStock() < item.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + vino.getNombre());
            }
            vino.setStock(vino.getStock() - item.getCantidad());
            vinoRepository.save(vino);

            BigDecimal subtotal = vino.getPrecioVenta().multiply(BigDecimal.valueOf(item.getCantidad()));
            total = total.add(subtotal);

            DetalleVenta d = new DetalleVenta();
            d.setVenta(venta);
            d.setVino(vino);
            d.setCantidad(item.getCantidad());
            d.setPrecioUnitario(vino.getPrecioVenta());
            detalles.add(d);
        }

        venta.setTotal(total);
        venta.setDetalles(detalles);
        return ventaRepository.save(venta);
    }

    public List<Venta> listarPorCliente(Long clienteId) {
        return ventaRepository.findByClienteIdOrderByFechaDesc(clienteId);
    }
}
