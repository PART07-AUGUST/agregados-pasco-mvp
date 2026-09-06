export interface ModeloVehiculoPesado {
  nombre: string;
  capacidadSugeridaM3: number;
}

export interface MarcaVehiculoPesado {
  marca: string;
  modelos: ModeloVehiculoPesado[];
}

/**
 * Catálogo local de las principales marcas y modelos de volquetes y camiones
 * de carga pesada utilizados en el sector construcción y minería en Perú.
 */
export const CATALOGO_VEHICULOS_PESADOS: MarcaVehiculoPesado[] = [
  {
    marca: 'Volvo',
    modelos: [
      { nombre: 'FMX 440 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'FMX 480 (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'FMX 500 (8x4)', capacidadSugeridaM3: 20 },
      { nombre: 'FM 370 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'FH 540 (Tracto/Semirremolque)', capacidadSugeridaM3: 24 },
      { nombre: 'VM 330 (6x4)', capacidadSugeridaM3: 12 },
    ],
  },
  {
    marca: 'Scania',
    modelos: [
      { nombre: 'G440 XT (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'G480 XT (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'P410 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'P380 (6x4)', capacidadSugeridaM3: 14 },
      { nombre: 'Heavy Tipper R500', capacidadSugeridaM3: 20 },
    ],
  },
  {
    marca: 'Mercedes-Benz',
    modelos: [
      { nombre: 'Actros 3344 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Arocs 4145 (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'Arocs 4848 (8x4)', capacidadSugeridaM3: 20 },
      { nombre: 'Axor 3340 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Atego 1725 (4x2)', capacidadSugeridaM3: 8 },
    ],
  },
  {
    marca: 'Shacman',
    modelos: [
      { nombre: 'F3000 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'F3000 (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'X3000 (6x4)', capacidadSugeridaM3: 16 },
      { nombre: 'X3000 (8x4)', capacidadSugeridaM3: 20 },
      { nombre: 'H3000 (6x4)', capacidadSugeridaM3: 14 },
    ],
  },
  {
    marca: 'Sinotruk (HOWO)',
    modelos: [
      { nombre: 'HOWO 371 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'HOWO A7 (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'HOWO TX (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Sitrak G7 (8x4)', capacidadSugeridaM3: 18 },
    ],
  },
  {
    marca: 'Mack',
    modelos: [
      { nombre: 'Granite (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Granite (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'Anthem (6x4)', capacidadSugeridaM3: 20 },
    ],
  },
  {
    marca: 'International',
    modelos: [
      { nombre: 'WorkStar 7600 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'HV Series (6x4)', capacidadSugeridaM3: 16 },
      { nombre: 'PayStar 5000 (8x4)', capacidadSugeridaM3: 18 },
    ],
  },
  {
    marca: 'Dongfeng',
    modelos: [
      { nombre: 'DFH 375 (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Tianlong KC (8x4)', capacidadSugeridaM3: 18 },
      { nombre: 'Kingrun (4x2)', capacidadSugeridaM3: 10 },
    ],
  },
  {
    marca: 'Isuzu',
    modelos: [
      { nombre: 'GIGA CYH (8x4)', capacidadSugeridaM3: 16 },
      { nombre: 'Forward FVR (4x2)', capacidadSugeridaM3: 10 },
    ],
  },
  {
    marca: 'Hyundai',
    modelos: [
      { nombre: 'HD270 Dump (6x4)', capacidadSugeridaM3: 15 },
      { nombre: 'Xcient Dump (8x4)', capacidadSugeridaM3: 18 },
    ],
  },
];
