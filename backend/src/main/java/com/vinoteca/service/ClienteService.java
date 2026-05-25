package com.vinoteca.service;

import com.vinoteca.model.Cliente;
import com.vinoteca.model.DiaSemana;
import com.vinoteca.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {
    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> listarTodos() { return clienteRepository.findAll(); }
    public Optional<Cliente> buscarPorId(Long id) { return clienteRepository.findById(id); }
    public Optional<Cliente> buscarPorTelefono(String tel) { return clienteRepository.findByTelefono(tel); }
    public List<Cliente> buscar(String q) { return clienteRepository.findByNombreContainingIgnoreCaseOrTelefonoContaining(q, q); }
    public List<Cliente> porDia(DiaSemana dia) { return clienteRepository.findByDiaRepartoOrderByNombreAsc(dia); }
    public Cliente guardar(Cliente c) { return clienteRepository.save(c); }
    public void eliminar(Long id) { clienteRepository.deleteById(id); }
}
