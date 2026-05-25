package com.vinoteca.model;

public enum DiaSemana {
    LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO;

    public static DiaSemana from(int value) {
        // 1=lunes ... 7=domingo (ISO)
        return switch (value) {
            case 1 -> LUNES;
            case 2 -> MARTES;
            case 3 -> MIERCOLES;
            case 4 -> JUEVES;
            case 5 -> VIERNES;
            case 6 -> SABADO;
            case 7 -> DOMINGO;
            default -> null;
        };
    }
}
