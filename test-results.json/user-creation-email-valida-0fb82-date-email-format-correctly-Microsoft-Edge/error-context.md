# Page snapshot

```yaml
- alert
- heading "Iniciar Sesión" [level=2]
- paragraph: Sistema de Gestión de Inventario LUMO
- heading "Acceso al Sistema" [level=3]
- paragraph: Ingresa tus credenciales para acceder al sistema de inventario
- text: Correo Electrónico
- textbox "Correo Electrónico"
- text: Contraseña
- textbox "Contraseña"
- button:
  - img
- button "Iniciar Sesión"
- link "¿Olvidaste tu contraseña?":
  - /url: /auth/reset-password
- text: Sistema de acceso restringido - Solo usuarios autorizados
```