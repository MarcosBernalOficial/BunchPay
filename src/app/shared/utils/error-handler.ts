/**
 * Procesa errores HTTP para mostrar mensajes amigables al usuario
 * Filtra errores técnicos del backend (JPA, Hibernate, SQL, etc.)
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Ocurrió un error. Intentá nuevamente.'): string {
  // Extraer el mensaje del error
  // El backend puede devolver: {field: "general", message: "..."} o solo un string
  let backendMsg = error?.error?.message || error?.error || error?.message;
  
  // Si error.error es string (JSON serializado), parsearlo
  if (typeof error?.error === 'string') {
    try {
      const parsed = JSON.parse(error.error);
      if (parsed.message) {
        backendMsg = parsed.message;
      }
    } catch (e) {
      // Si no es JSON válido, usar el string tal cual
      backendMsg = error.error;
    }
  }
  
  // Si backendMsg es un objeto con estructura {field, message}, extraer el message
  if (backendMsg && typeof backendMsg === 'object' && backendMsg.message) {
    backendMsg = backendMsg.message;
  }
  
  if (!backendMsg) {
    return defaultMessage;
  }
  
  // Si es un string, verificar si contiene errores técnicos
  if (typeof backendMsg === 'string') {
    // Lista de palabras clave que indican errores técnicos del servidor
    const technicalErrors = [
      'lazily initialize',
      'Session',
      'proxy',
      'JDBC',
      'SQLException',
      'Hibernate',
      'JPA',
      'NullPointerException',
      'StackTrace',
      'java.lang',
      'com.example',
      'org.springframework',
      'org.hibernate'
    ];
    
    // Si contiene alguna palabra técnica, devolver mensaje genérico
    if (technicalErrors.some(keyword => backendMsg.includes(keyword))) {
      return 'Error del servidor. Por favor, contactá con soporte.';
    }
    
    // Si es un mensaje limpio del backend, devolverlo
    return backendMsg;
  }
  
  return defaultMessage;
}

/**
 * Verifica si un error es de autenticación/autorización
 */
export function isAuthError(error: any): boolean {
  return error?.status === 401 || error?.status === 403;
}

/**
 * Verifica si un error es de servidor (5xx)
 */
export function isServerError(error: any): boolean {
  return error?.status >= 500 && error?.status < 600;
}

/**
 * Verifica si un error es de cliente (4xx)
 */
export function isClientError(error: any): boolean {
  return error?.status >= 400 && error?.status < 500;
}
