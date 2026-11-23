// Catálogo de materias con su programa oficial, separado en temas del tamaño de un par de pomodoros.
// Cada materia: id, name, inst (dónde se cursa), keys (palabras para encontrarla), source y units.
// Para sumar una materia nueva, copiá el bloque y cargá las unidades tal como figuran en el programa.
window.FOCO_CATALOG = [
  {
    id: 'uba-cbc-fisica-03',
    name: 'Física (03)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'fisica 03 cbc uba xxi ubaxxi ciclo basico comun presencial normal regular sede mecanica',
    source: 'Programa oficial CBC · Cód. 03',
    units: [
      { name: 'Magnitudes físicas', topics: [
        'Magnitudes escalares y vectoriales',
        'Operaciones con vectores: suma, resta y por un escalar',
        'Producto escalar y producto vectorial',
        'Coordenadas cartesianas, versores y componentes',
        'Proyecciones de un vector',
        'Análisis dimensional'
      ] },
      { name: 'Estática', topics: [
        'Fuerzas y momento de una fuerza',
        'Cuerpos puntuales: resultante y equilibrante',
        'Cuerpos extensos: centro de gravedad y momento neto',
        'Condiciones de equilibrio de cuerpos extensos',
        'Cuerpos vinculados y reacciones de vínculo',
        'Máquinas simples'
      ] },
      { name: 'Hidrostática', topics: [
        'Densidad, peso específico y presión',
        'Fluido ideal y presión en líquidos y gases',
        'Principio de Pascal y prensa hidráulica',
        'Teorema fundamental de la hidrostática',
        'Experiencia de Torricelli: presión absoluta y manométrica',
        'Arquímedes: empuje, flotación y peso aparente'
      ] },
      { name: 'Cinemática en una dimensión', topics: [
        'Punto material y sistemas de referencia',
        'Posición, desplazamiento, distancia y trayectoria',
        'Velocidad media, instantánea y rapidez',
        'Aceleración media e instantánea',
        'Ecuaciones horarias: MRU y MRUV',
        'Caída libre y tiro vertical',
        'Gráficos x(t), v(t) y a(t) y su interpretación'
      ] },
      { name: 'Cinemática en dos dimensiones', topics: [
        'Movimiento en el plano y coordenadas intrínsecas',
        'Aceleración tangencial, normal y total',
        'Tiro oblicuo',
        'Movimiento circular: período, frecuencia, velocidad y aceleración angular',
        'Movimiento relativo'
      ] },
      { name: 'Dinámica', topics: [
        'Fuerzas fundamentales y leyes de Newton',
        'Peso, masa y diagrama de cuerpo libre',
        'Normal y rozamiento',
        'Fuerza elástica y gravitatoria',
        'Sistemas inerciales y no inerciales: fuerzas ficticias',
        'Sistemas de cuerpos vinculados',
        'Dinámica circular: peralte y péndulo cónico',
        'Oscilaciones: péndulo simple y masa-resorte'
      ] },
      { name: 'Trabajo y energía', topics: [
        'Energía cinética y trabajo de una fuerza',
        'Potencia',
        'Teorema del trabajo y la energía cinética',
        'Fuerzas conservativas y no conservativas',
        'Energía potencial gravitatoria y elástica',
        'Conservación de la energía mecánica'
      ] }
    ]
  }
];
