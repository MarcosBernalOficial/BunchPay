# BunchPay Frontend

## 📋 Descripción

BunchPay es una aplicación de billetera digital desarrollada con Angular 20 que permite a los usuarios gestionar sus finanzas de manera segura y eficiente. La plataforma incluye funcionalidades completas de transferencias, pagos de servicios, gestión de tarjetas, criptomonedas y un sistema de soporte en tiempo real.

## 🚀 Tecnologías Principales

- **Angular 20** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS** - Estilos y diseño responsive
- **RxJS** - Programación reactiva
- **Signals** - Sistema de reactividad de Angular
- **WebSocket (STOMP)** - Comunicación en tiempo real para chat
- **Standalone Components** - Arquitectura moderna de Angular

## 📁 Estructura del Proyecto

```
src/app/
├── core/                          # Funcionalidades core
│   ├── guards/                    # Protección de rutas
│   │   ├── auth.guard.ts         # Verificación de autenticación
│   │   └── role.guard.ts         # Verificación de roles
│   └── interceptors/
│       └── jwt.interceptor.ts    # Interceptor para tokens JWT
│
├── features/                      # Módulos funcionales
│   ├── account/                   # Gestión de cuenta
│   │   ├── components/
│   │   │   └── cards/            # Gestión de tarjetas
│   │   ├── models/
│   │   └── services/
│   │       ├── account.service.ts
│   │       └── card.service.ts
│   │
│   ├── admin/                     # Panel de administración
│   │   ├── components/
│   │   │   └── admin-supports/   # CRUD de usuarios support
│   │   └── services/
│   │
│   ├── auth/                      # Autenticación
│   │   ├── components/
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── services/
│   │       └── auth.service.ts
│   │
│   ├── chat/                      # Sistema de chat
│   │   └── services/
│   │       └── chat.service.ts   # WebSocket STOMP
│   │
│   ├── crypto/                    # Precios de criptomonedas
│   │   ├── components/
│   │   │   └── crypto-list/
│   │   └── services/
│   │
│   ├── dashboard/                 # Panel principal
│   │   ├── components/
│   │   └── services/
│   │       └── discount-coupon.service.ts
│   │
│   ├── services/                  # Pagos de servicios
│   │   ├── components/
│   │   │   ├── recharge/         # SUBE, celular, Steam
│   │   │   └── payment/
│   │   └── models/
│   │
│   ├── settings/                  # Configuración de usuario
│   │   └── components/
│   │
│   ├── support/                   # Sistema de soporte
│   │   ├── components/
│   │   │   ├── support-home/     # Interfaz para agentes
│   │   │   └── support-chat/     # Chat del cliente
│   │   └── services/
│   │
│   └── transactions/              # Transacciones
│       ├── components/
│       │   ├── history/          # Historial completo
│       │   └── transfer/         # Transferencias
│       ├── models/
│       └── services/
│
├── layout/                        # Componentes de layout
│   └── components/
│       ├── footer/
│       ├── header/
│       └── sidebar/
│
└── shared/                        # Componentes y utilidades compartidas
    ├── components/
    │   └── page-header/
    ├── models/
    └── utils/
        ├── form-helpers.ts       # Utilidades de formularios
        └── error-handler.ts      # Manejo de errores HTTP
```

## ✨ Características Principales

### 🔐 Autenticación y Seguridad

- Sistema de login/registro con validaciones estrictas
- JWT para autenticación
- Interceptor HTTP para agregar tokens automáticamente
- Guards para protección de rutas por rol (CLIENT, SUPPORT, ADMIN)
- Manejo inteligente de errores 401/403

**Validaciones:**

- Email: formato válido requerido
- Contraseña: mínimo 8 caracteres, mayúscula, minúscula, número
- Nombre/Apellido: solo letras, sin espacios ni números
- DNI: solo números, no modificable después del registro

### 💰 Dashboard

- **Resumen de cuenta:**

  - Visualización de saldo con opción de ocultar
  - Alias y CVU con función de copiado rápido
  - Edición de alias en tiempo real

- **Últimos movimientos:**

  - 5 transacciones recientes
  - Diferenciación visual entre depósitos (verde) y retiros (rojo)
  - Muestra nombre completo del remitente/destinatario en transferencias

- **Servicios rápidos:**

  - Recarga SUBE
  - Recarga de celular
  - Recarga Steam

- **Beneficios:**
  - Cupones de descuento activos
  - Copiado rápido de códigos
  - Visualización de fecha de vencimiento

### 💸 Transferencias

- **Input único inteligente:**

  - Acepta Alias (mínimo 6 caracteres, alfanumérico con . o \_)
  - Acepta CVU (exactamente 22 dígitos)
  - Detección automática del tipo de identificador

- **Validaciones en tiempo real:**

  - Verificación de formato
  - Validación de monto
  - Mensajes de error descriptivos

- **Comprobantes:**
  - Generación automática de comprobante después de transferencia exitosa

### 📜 Historial de Transacciones

- **Vista en formato comprobante:**

  - Transferencias muestran datos completos:
    - Remitente: nombre completo y CVU
    - Destinatario: nombre completo y CVU
    - Monto y fecha
  - Otros tipos mantienen descripción simple

- **Orden cronológico:**
  - Transacciones más recientes primero
  - Diferenciación visual por tipo

### 💳 Gestión de Tarjetas

- Listado de tarjetas asociadas
- Visualización de datos de tarjeta
- Gestión de tarjetas activas/inactivas

### 🏪 Pagos de Servicios

- **SUBE:**

  - Validación: 16 dígitos exactos
  - Montos predefinidos

- **Recarga de celular:**

  - Validación flexible: 8-13 dígitos (soporta diferentes países)
  - Múltiples operadoras

- **Steam:**
  - Validación estricta: solo cuentas Gmail
  - Formato: usuario@gmail.com

### 📊 Criptomonedas

- **Integración con Binance API:**
  - Visualización de precios en tiempo real
  - Bitcoin, Ethereum, USDT, BNB, Cardano, Solana, Dogecoin
  - Auto-refresh cada 30 segundos
  - Actualización manual disponible
  - Formato de precios en pesos argentinos (ARS)

### 💬 Sistema de Soporte en Tiempo Real

#### Para Clientes:

- **Chat integrado:**
  - Inicio automático de conversación
  - WebSocket para mensajes instantáneos
  - Notificación cuando el soporte cierra el chat
  - Creación automática de nuevo chat tras cierre

#### Para Agentes de Soporte:

- **Panel de gestión:**

  - Vista de chats sin asignar
  - Vista de chats propios
  - Asignación de chats con feedback visual
  - Estados: abierto/cerrado

- **Características:**
  - Deshabilitación de input en chats no asignados
  - Deshabilitación de input en chats cerrados
  - Ordenamiento: chats abiertos primero, cerrados al final
  - Filtrado: solo muestra chats con mensajes
  - Prevención de mensajes duplicados
  - Auto-refresh cada 8 segundos
  - Responsive design

### ⚙️ Configuración de Usuario

- **Perfil:**

  - Edición de nombre y apellido
  - DNI y email son solo lectura
  - Validaciones de formato

- **Cambio de contraseña:**
  - Verificación de contraseña actual
  - Validaciones de seguridad para nueva contraseña
  - Feedback claro de errores
  - Limpieza de formulario después de éxito

### 👨‍💼 Panel de Administración

- **Gestión de usuarios Support:**
  - Listado completo de agentes
  - Creación de nuevos usuarios support
  - Edición de datos existentes
  - Eliminación de usuarios
  - Validaciones estrictas en formularios

## 🎨 Diseño y UX

### Tema Visual

- **Diseño oscuro (dark theme)** predominante
- **Paleta de colores:**
  - Fondo: Negro (#000000)
  - Texto: Blanco con opacidades variadas
  - Éxito: Verde (#22c55e)
  - Error: Rojo (#ef4444)
  - Bordes: Blanco con opacidad 10-30%

### Responsive Design

- **Mobile-first approach**
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
- Layouts adaptativos en todas las vistas

### Animaciones y Feedback

- Transiciones suaves en botones y cards
- Efectos hover en elementos interactivos
- Spinners de carga personalizados
- Mensajes de éxito/error con auto-dismiss
- Estados de carga visibles

## 🔧 Patrones y Arquitectura

### Change Detection Strategy

- **OnPush** en la mayoría de componentes
- Uso de `ChangeDetectorRef` para actualizaciones manuales
- `markForCheck()` para cambios asíncronos
- `detectChanges()` para actualizaciones inmediatas

### Gestión de Estado

- **Angular Signals** para reactividad
- `computed()` para valores derivados
- Servicios con signals para estado compartido

### Formularios Reactivos

- `ReactiveFormsModule` en todos los formularios
- Validadores personalizados
- Validaciones sincrónicas y asíncronas
- Utilidades compartidas para manejo de formularios

### WebSocket

- **STOMP sobre WebSocket** para chat en tiempo real
- Reconexión automática
- Manejo de suscripciones
- Desuscripción limpia al destruir componentes

### HTTP Interceptors

- Inyección automática de JWT en requests
- Manejo inteligente de errores 401/403
- Diferenciación entre token expirado y credenciales incorrectas

## 🛡️ Validaciones

### Patrones Regex Utilizados

```typescript
// Nombre/Apellido: solo letras (con acentos)
/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/

// Contraseña: min 8, mayúscula, minúscula, número
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

// Celular: 8-13 dígitos (códigos de área variables)
/^\d{8,13}$/

// Steam: solo Gmail
/^[a-zA-Z0-9._%+-]+@gmail\.com$/

// CVU: exactamente 22 dígitos
/^\d{22}$/

// Alias: mínimo 6 caracteres, alfanumérico con . o _
/^[a-zA-Z0-9._]{6,}$/

// SUBE: exactamente 16 dígitos
/^\d{16}$/
```

## 📦 Dependencias Principales

```json
{
  "@angular/animations": "^20.0.0",
  "@angular/common": "^20.0.0",
  "@angular/core": "^20.0.0",
  "@angular/forms": "^20.0.0",
  "@angular/platform-browser": "^20.0.0",
  "@angular/router": "^20.0.0",
  "@stomp/stompjs": "^7.0.0",
  "rxjs": "~7.8.0",
  "sockjs-client": "^1.6.1",
  "tailwindcss": "^3.4.0",
  "typescript": "~5.6.2"
}
```

## 🚀 Instalación y Ejecución

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Angular CLI

## 🌐 API Endpoints

La aplicación se conecta al backend en `http://localhost:8080`

### Principales endpoints:

- **Auth:** `/auth/login`, `/auth/register`, `/auth/logout`
- **Account:** `/client/account`, `/client/change-password`
- **Transactions:** `/transactions/transfer`, `/transactions/viewAll`
- **Cards:** `/card/list`, `/card/create`
- **Services:** `/service/recharge/sube`, `/service/recharge/celular`, `/service/recharge/steam`
- **Support:** `/support/chats/*`, WebSocket en `/ws`
- **Admin:** `/admin/support/*`
- **Crypto:** `/crypto/prices`
- **Coupons:** `/discountCoupon/available`

## 🔒 Roles y Permisos

### CLIENT

- Acceso a dashboard
- Transferencias y pagos
- Gestión de tarjetas
- Chat de soporte
- Configuración personal

### SUPPORT

- Panel de soporte
- Gestión de chats
- Asignación de conversaciones
- Cierre de tickets

### ADMIN

- Panel de administración
- Gestión de usuarios support
- Acceso completo al sistema

## 📝 Utilidades Compartidas

### form-helpers.ts

```typescript
// Marcar todos los campos como touched
markAllAsTouched(formGroup: FormGroup)

// Validador para campos coincidentes (ej: confirmar contraseña)
matchFieldsValidator(field1, field2, errorKey)
```

### error-handler.ts

```typescript
// Extraer mensaje de error de respuestas HTTP
getErrorMessage(error, defaultMessage?)
```

## 🎯 Características Destacadas

1. **Detección automática de Alias/CVU** en transferencias
2. **Chat en tiempo real** con WebSocket
3. **Prevención de duplicados** en mensajes de chat
4. **Auto-refresh** de precios de criptomonedas
5. **Validaciones específicas** por tipo de servicio
6. **Ordenamiento inteligente** de chats (abiertos primero)
7. **Manejo robusto de errores** con feedback visual
8. **Responsive design** completo

## 👥 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 👨‍💻 Desarrolladores

- Burry Berenice
- Carril Agustin
- Marcos Bernal
