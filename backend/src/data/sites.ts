import { Site } from "../types";

// Sitios/aduanas de El Salvador. Coordenadas verificadas contra OpenStreetMap
// (Nominatim) sobre los puntos oficiales de cada puesto fronterizo/puerto/sede
// (2026-07-15) — el set original tenía varios sitios mal ubicados (p. ej. El
// Amatillo apuntaba a un caserío costero homónimo en Meanguera del Golfo, y
// El Poy/San Cristóbal tenían longitudes erróneas). Esta es la única fuente
// de verdad para sitios en el mock; al migrar a osTicket real, esto se
// reemplaza por una consulta a la tabla de sitios/departamentos correspondiente.
export const SITES: Site[] = [
  {
    id: "site-el-amatillo",
    name: "El Amatillo",
    type: "aduana_terrestre",
    lat: 13.5979,
    lng: -87.7678,
  },
  {
    id: "site-las-chinamas",
    name: "Las Chinamas",
    type: "aduana_terrestre",
    lat: 14.0179,
    lng: -89.9056,
  },
  {
    id: "site-san-cristobal",
    name: "San Cristóbal",
    type: "aduana_terrestre",
    lat: 14.1838,
    lng: -89.6673,
  },
  {
    id: "site-anguiatu",
    name: "Anguiatú",
    type: "aduana_terrestre",
    lat: 14.4121,
    lng: -89.4365,
  },
  {
    id: "site-el-poy",
    name: "El Poy",
    type: "aduana_terrestre",
    lat: 14.3726,
    lng: -89.2096,
  },
  {
    id: "site-la-hachadura",
    name: "La Hachadura",
    type: "aduana_terrestre",
    lat: 13.8599,
    lng: -90.0871,
  },
  {
    id: "site-acajutla",
    name: "Puerto de Acajutla",
    type: "aduana_maritima",
    lat: 13.577,
    lng: -89.8317,
  },
  {
    id: "site-la-union",
    name: "Puerto de La Unión",
    type: "aduana_maritima",
    lat: 13.3325,
    lng: -87.8234,
  },
  {
    id: "site-aeropuerto",
    name: "Aeropuerto Internacional El Salvador",
    type: "aduana_aerea",
    lat: 13.4514,
    lng: -89.0523,
  },
  {
    id: "site-dga-san-salvador",
    name: "Dirección General de Aduanas, San Salvador",
    type: "sede",
    lat: 13.7045,
    lng: -89.2005,
  },
];
