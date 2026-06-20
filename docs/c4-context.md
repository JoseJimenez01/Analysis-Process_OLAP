# C4 - Contexto

```mermaid
C4Context
  title PY01 Restaurantes - Contexto
  Person(customer, "Cliente")
  Person(admin, "Administrador")
  System(system, "Plataforma de Restaurantes", "Gestion de restaurantes, menus y reservas")
  Rel(customer, system, "Consulta y reserva")
  Rel(admin, system, "Administra catalogos")
```
