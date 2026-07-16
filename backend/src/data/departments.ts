// Departamentos reales manejados por la mesa de ayuda.
export const DEPARTMENTS = [
  "CCTV",
  "Mantenimiento",
  "Operaciones",
  "Proveedor Externo",
  "Redes",
  "Soporte",
  "Ventas",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// Temas de ayuda reales, agrupados por el departamento que normalmente
// los atiende. Se usan para generar asuntos de tickets realistas.
export const TOPICS_BY_DEPARTMENT: Record<Department, string[]> = {
  CCTV: [
    "CCTV, Soporte y Solicitudes",
    "Instalación de Cámaras o equipos",
    "Mantenimiento Correctivo de CCTV",
    "Mantenimiento Preventivo de CCTV",
  ],
  Mantenimiento: [
    "Instalaciones en infraestructura de sitios",
    "Mantenimiento Correctivo",
    "Mantenimiento Preventivo",
    "Suministro de bienes",
  ],
  Operaciones: [
    "Informar de un problema",
    "Consulta general",
    "DataSets",
  ],
  "Proveedor Externo": [
    "Suministro de bienes",
    "Instalación de Cámaras o equipos",
    "Instalaciones en infraestructura de sitios",
  ],
  Redes: ["Fallo de enlaces y comunicaciones", "Soporte TI"],
  Soporte: [
    "Soporte TI",
    "Problema de acceso",
    "Escáneres de Rayos X",
    "Detector de Explosivos",
    "Consulta general",
    "Comentarios",
  ],
  Ventas: ["Consulta general", "Comentarios"],
};

export const REQUESTER_FIRST_NAMES = [
  "Carlos",
  "María",
  "José",
  "Ana",
  "Luis",
  "Karla",
  "Roberto",
  "Fátima",
  "Douglas",
  "Silvia",
  "Ricardo",
  "Patricia",
  "Miguel",
  "Vanessa",
  "Óscar",
  "Claudia",
  "Erick",
  "Gabriela",
  "Manuel",
  "Reina",
];

export const REQUESTER_LAST_NAMES = [
  "Hernández",
  "Martínez",
  "López",
  "González",
  "Rivas",
  "Escobar",
  "Ramírez",
  "Flores",
  "Alvarado",
  "Guevara",
  "Portillo",
  "Menjívar",
  "Cruz",
  "Aguilar",
  "Chávez",
  "Zavala",
];
