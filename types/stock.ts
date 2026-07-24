export interface Product {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  almacenamiento: string;
  ram: string;
}

export interface Repartidor {
  id: string;
  nombre: string;
}

export interface ZonaRepartoItem {
  id: string;
  nombre_zona: string;
  sigla?: string;
  repartidor_id: string;
  repartidor_nombre: string;
}
