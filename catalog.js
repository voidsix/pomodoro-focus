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
  },

  // ======================= UBA · CBC (contenidos mínimos: iguales para todas las cátedras) =======================
  {
    id: 'uba-cbc-quimica-05',
    name: 'Química (05)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'quimica 05 cbc uba xxi ubaxxi ciclo basico comun presencial normal regular',
    source: 'Contenidos mínimos oficiales CBC · Res. CS 4426/16',
    units: [
      { name: 'Sistemas materiales', topics: [
        'Características de la materia y cambios de estado',
        'Clasificación de sistemas materiales',
        'Sustancias puras y mezclas'
      ] },
      { name: 'Estructura atómica y tabla periódica', topics: [
        'Partículas subatómicas, número atómico y másico',
        'Isótopos e iones',
        'Modelo de Bohr y modelo orbital',
        'Configuración electrónica',
        'Tabla periódica: períodos y grupos',
        'Propiedades periódicas: radio, electronegatividad, energía de ionización'
      ] },
      { name: 'Uniones químicas y nomenclatura', topics: [
        'Uniones iónica, covalente y metálica',
        'Covalente simple, múltiple y dativa · estructuras de Lewis',
        'Longitud, energía y polaridad del enlace',
        'Número de oxidación',
        'Nomenclatura de compuestos binarios',
        'Nomenclatura de compuestos ternarios y cuaternarios'
      ] },
      { name: 'Fuerzas entre partículas y propiedades', topics: [
        'TRePEV y geometría molecular',
        'Polaridad de moléculas y geometría de iones',
        'Fuerzas intermoleculares: London, dipolo-dipolo, puente de hidrógeno',
        'Estructura y propiedades: fusión, ebullición y solubilidad'
      ] },
      { name: 'Magnitudes atómicas y moleculares', topics: [
        'Masa atómica y masa molecular',
        'Mol, masa molar y constante de Avogadro',
        'Volumen molar'
      ] },
      { name: 'Gases ideales', topics: [
        'Propiedades de los gases y teoría cinético-molecular',
        'Ecuación general del gas ideal',
        'Mezcla de gases: presiones parciales y fracción molar'
      ] },
      { name: 'Soluciones', topics: [
        'Soluto, solvente y tipos de soluciones',
        'Concentración: % m/m, % m/V, % V/V, molaridad, ppm',
        'Compuestos iónicos en agua: disociación y electrolitos',
        'Dilución y mezcla de soluciones'
      ] },
      { name: 'Reacciones químicas', topics: [
        'Ecuaciones químicas y tipos de reacción',
        'Balanceo de ecuaciones',
        'Redox: método ion-electrón en medio ácido y básico',
        'Estequiometría',
        'Reactivo limitante, pureza y rendimiento'
      ] },
      { name: 'Equilibrio y cinética química', topics: [
        'Constante de equilibrio y cociente de reacción',
        'Principio de Le Chatelier',
        'Nociones de cinética y velocidad de reacción'
      ] },
      { name: 'Ácidos y bases', topics: [
        'Teorías de Arrhenius y Brönsted-Lowry',
        'Autoionización del agua y escala de pH',
        'Ácidos y bases fuertes',
        'Equilibrio ácido-base'
      ] },
      { name: 'Compuestos orgánicos (solo Odontología)', topics: [
        'Hidrocarburos',
        'Alcoholes, aldehídos, cetonas y ácidos carboxílicos',
        'Ésteres, éteres, aminas, amidas y halogenados',
        'Nomenclatura orgánica',
        'Isomería y quiralidad'
      ] }
    ]
  },
  {
    id: 'uba-cbc-matematica-51',
    name: 'Matemática (51)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'matematica 51 cbc uba xxi ubaxxi ciclo basico comun presencial normal regular',
    source: 'Contenidos mínimos oficiales CBC · Res. UBA 917/90',
    units: [
      { name: 'Funciones', topics: [
        'Función, dominio e imagen',
        'Funciones biyectivas y función inversa',
        'Composición de funciones',
        'Operaciones con funciones y sus dominios'
      ] },
      { name: 'Funciones lineales, cuadráticas y polinómicas', topics: [
        'Función lineal: pendiente y ordenada al origen',
        'Rectas paralelas y perpendiculares',
        'Sistemas de dos ecuaciones lineales',
        'Función cuadrática: vértice y eje de simetría',
        'Ecuaciones cuadráticas y sistemas mixtos',
        'Polinomios: teorema del resto, raíces y factoreo',
        'Funciones racionales: dominio y ceros'
      ] },
      { name: 'Funciones exponenciales y trigonométricas', topics: [
        'Exponentes y notación científica',
        'Función exponencial',
        'Logaritmo, propiedades y cambio de base',
        'Escalas logarítmicas y crecimiento de poblaciones',
        'Sistema sexagesimal y circular',
        'Funciones trigonométricas y sus gráficos',
        'Funciones trigonométricas inversas y fórmulas'
      ] },
      { name: 'Derivadas e integrales', topics: [
        'Límite y definición de derivada',
        'Interpretación geométrica y cinemática de la derivada',
        'Reglas de derivación',
        'Primitivas y métodos de integración',
        'Integral definida y regla de Barrow'
      ] },
      { name: 'Vectores en el plano y el espacio', topics: [
        'Suma de vectores y producto por un número',
        'Componentes de un vector',
        'Producto escalar, vectorial y mixto',
        'Ecuaciones vectoriales de la recta y del plano'
      ] }
    ]
  },
  {
    id: 'uba-cbc-icse-24',
    name: 'Introducción al Conocimiento de la Sociedad y el Estado (24)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'icse sociedad y estado 24 cbc uba xxi ubaxxi ciclo basico comun presencial normal regular',
    source: 'Contenidos mínimos oficiales CBC (Consejo Superior UBA)',
    units: [
      { name: 'La sociedad', topics: [
        'Conceptos básicos de sociedad y estratificación social',
        'Orden, cooperación y conflicto',
        'Actores sociopolíticos y organizaciones de interés',
        'Desigualdad, pobreza, exclusión y protesta social',
        'Ciencia, tecnología, cultura y economía: consecuencias sociopolíticas',
        'TIC, cambios demográficos y mundo del trabajo'
      ] },
      { name: 'El Estado', topics: [
        'Definiciones, tipos y elementos del Estado',
        'Origen y evolución histórica del Estado',
        'Formación y consolidación del Estado argentino',
        'Nación, representación, ciudadanía y participación',
        'Totalitarismo, autoritarismo y democracia',
        'Instituciones de la democracia argentina',
        'Globalización e integración regional'
      ] },
      { name: 'Estado, desarrollo y políticas públicas', topics: [
        'Modelos de desarrollo socioeconómico',
        'Políticas públicas en economía e infraestructura',
        'Políticas de salud, ciencia y técnica',
        'Políticas educativas y la universidad'
      ] }
    ]
  },

  // ======================= UTN (programas de FRBA; contenidos mínimos comunes a todas las regionales) =======================
  {
    id: 'utn-analisis-1',
    name: 'Análisis Matemático I',
    inst: 'UTN · FRBA, FRC y demás regionales',
    keys: 'analisis matematico 1 i am1 utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria',
    source: 'Programa UTN FRBA 2023 · contenidos mínimos comunes a todas las regionales',
    units: [
      { name: 'Topología en la recta real y funciones', topics: [
        'Valor absoluto, conjuntos acotados, supremo e ínfimo',
        'Clasificación de puntos y conjuntos en R',
        'Funciones: clasificación, inversa y composición',
        'Desplazamientos, simetría y cambio de escala',
        'Funciones hiperbólicas y paramétricas'
      ] },
      { name: 'Límite de funciones', topics: [
        'Definición de límite y límites laterales',
        'Álgebra de límites',
        'Infinitésimos y su sustitución',
        'Límites en el infinito y límites infinitos',
        'Indeterminaciones'
      ] },
      { name: 'Sucesiones reales', topics: [
        'Convergencia de sucesiones',
        'Sucesiones monótonas, acotadas y de Cauchy',
        'El número e y criterios de convergencia'
      ] },
      { name: 'Funciones continuas', topics: [
        'Continuidad en un punto y discontinuidades',
        'Asíntotas',
        'Teoremas de Bolzano, Weierstrass y valor intermedio',
        'Aproximación de raíces'
      ] },
      { name: 'Funciones diferenciables', topics: [
        'Definición e interpretación de la derivada',
        'Reglas de derivación, compuesta e inversa',
        'Derivadas implícitas y paramétricas',
        'Diferencial y aproximación lineal',
        'Teoremas de Rolle, Lagrange, Cauchy y L\'Hôpital',
        'Extremos, crecimiento, concavidad e inflexión',
        'Trazado de curvas y optimización'
      ] },
      { name: 'Polinomios de Taylor', topics: [
        'Polinomio y teorema de Taylor',
        'Resto de Lagrange y error de truncamiento'
      ] },
      { name: 'Cálculo integral', topics: [
        'Sumas de Riemann e integral definida',
        'Funciones integrables y propiedades',
        'Teorema del valor medio del cálculo integral'
      ] },
      { name: 'Relación entre cálculo diferencial e integral', topics: [
        'Función integral y teorema fundamental',
        'Integración por sustitución y por partes',
        'Fracciones simples',
        'Aplicaciones geométricas y físicas',
        'Integrales impropias'
      ] },
      { name: 'Series numéricas y funcionales', topics: [
        'Series numéricas: geométrica y armónica',
        'Criterios de convergencia',
        'Series alternadas y convergencia absoluta',
        'Series de potencias y radio de convergencia',
        'Serie de Taylor'
      ] }
    ]
  },
  {
    id: 'utn-algebra-ga',
    name: 'Álgebra y Geometría Analítica',
    inst: 'UTN · FRBA, FRC y demás regionales',
    keys: 'algebra y geometria analitica ayga aga utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria',
    source: 'Programa UTN FRBA 2024 · contenidos mínimos comunes a todas las regionales',
    units: [
      { name: 'Vectores geométricos, recta y plano', topics: [
        'Operaciones con vectores y módulo',
        'Producto escalar, vectorial y mixto',
        'Recta en R2 y en R3',
        'Ecuaciones del plano',
        'Distancias, ángulos y posiciones relativas',
        'Proyecciones ortogonales'
      ] },
      { name: 'Espacio vectorial', topics: [
        'Espacios y subespacios vectoriales',
        'Combinación lineal e independencia lineal',
        'Generadores, base y dimensión',
        'Cambio de base y bases ortonormales'
      ] },
      { name: 'Matrices', topics: [
        'Operaciones con matrices',
        'Matrices especiales',
        'Rango y operaciones elementales',
        'Inversa por Gauss-Jordan'
      ] },
      { name: 'Determinantes', topics: [
        'Definición y propiedades',
        'Desarrollo por Laplace (cofactores)',
        'Inversa con la matriz adjunta'
      ] },
      { name: 'Sistemas de ecuaciones lineales', topics: [
        'Forma matricial y teorema de Rouché-Frobenius',
        'Eliminación de Gauss',
        'Regla de Cramer e inversión',
        'Sistemas homogéneos'
      ] },
      { name: 'Transformaciones lineales', topics: [
        'Definición y propiedades',
        'Núcleo, imagen y teorema de las dimensiones',
        'Matriz asociada y cambio de base',
        'Transformaciones geométricas: simetrías, proyecciones, rotaciones'
      ] },
      { name: 'Cónicas', topics: [
        'Circunferencia y elipse',
        'Hipérbola y parábola',
        'Traslación de ejes y ecuaciones paramétricas'
      ] },
      { name: 'Superficies', topics: [
        'Superficie esférica, cilíndrica y cónica',
        'Superficies de revolución',
        'Cuádricas'
      ] },
      { name: 'Autovalores y autovectores', topics: [
        'Autovalores y autovectores',
        'Diagonalización y potencias de matrices',
        'Aplicación a la geometría'
      ] },
      { name: 'Números complejos', topics: [
        'Formas de expresión y representación',
        'Operaciones con complejos'
      ] }
    ]
  },
  {
    id: 'utn-fisica-1',
    name: 'Física I',
    inst: 'UTN · FRBA, FRC y demás regionales',
    keys: 'fisica 1 i utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria mecanica',
    source: 'Programa UTN FRBA · contenidos mínimos comunes a todas las regionales',
    units: [
      { name: 'Mediciones y errores', topics: [
        'Método científico y mediciones',
        'Errores absoluto, relativo y propagación'
      ] },
      { name: 'Cinemática del punto', topics: [
        'Posición, velocidad y aceleración',
        'MRU y MRUV',
        'Componentes intrínsecas de la aceleración',
        'Tiro oblicuo',
        'Movimiento circular',
        'Movimiento relativo'
      ] },
      { name: 'Dinámica del punto', topics: [
        'Leyes de Newton',
        'Rozamiento, fuerza elástica y gravitatoria',
        'Impulso',
        'Trabajo, potencia y energía cinética',
        'Energía potencial y mecánica',
        'Fuerzas no conservativas'
      ] },
      { name: 'Sistemas de partículas', topics: [
        'Fuerzas interiores y exteriores',
        'Cantidad de movimiento y su conservación',
        'Centro de masa',
        'Choques elásticos e inelásticos'
      ] },
      { name: 'Cinemática del cuerpo rígido', topics: [
        'Rotación pura y rototraslación',
        'Eje instantáneo de rotación'
      ] },
      { name: 'Dinámica del cuerpo rígido', topics: [
        'Momento de inercia y teorema de Steiner',
        'Momento angular y su conservación',
        'Rodadura',
        'Energía en la rotación'
      ] },
      { name: 'Estática del cuerpo rígido', topics: [
        'Condiciones de equilibrio',
        'Fuerzas concurrentes y no concurrentes'
      ] },
      { name: 'Movimiento oscilatorio', topics: [
        'Movimiento armónico simple y masa-resorte',
        'Péndulo simple y físico',
        'Oscilaciones amortiguadas, forzadas y resonancia'
      ] },
      { name: 'Elasticidad y ondas', topics: [
        'Tensiones, deformaciones y módulos elásticos',
        'Ondas mecánicas: función de onda, longitudinales y transversales'
      ] },
      { name: 'Fluidos en equilibrio', topics: [
        'Presión y principio de Pascal',
        'Teorema fundamental de la hidrostática',
        'Principio de Arquímedes'
      ] },
      { name: 'Dinámica de fluidos', topics: [
        'Caudal y ecuación de continuidad',
        'Teorema de Bernoulli y aplicaciones'
      ] },
      { name: 'Óptica geométrica', topics: [
        'Reflexión y espejos',
        'Refracción y reflexión total',
        'Lentes delgadas e instrumentos ópticos'
      ] }
    ]
  },

  // ======================= UNC · FCEFyN (Córdoba) =======================
  {
    id: 'unc-fcefyn-analisis-1',
    name: 'Análisis Matemático 1',
    inst: 'UNC · FCEFyN (Córdoba)',
    keys: 'analisis matematico 1 i am1 unc universidad nacional de cordoba fcefyn ingenieria',
    source: 'Programa oficial FCEFyN · cód. 10-04053',
    units: [
      { name: 'Funciones', topics: [
        'Definición, clasificación y gráficos',
        'Álgebra y composición de funciones',
        'Función inversa'
      ] },
      { name: 'Límite, continuidad y derivadas', topics: [
        'Entornos y límite: definición e interpretación',
        'Límites laterales, infinitos e indeterminaciones',
        'Límites notables',
        'Continuidad y discontinuidades',
        'Derivada: definición, interpretación y recta tangente',
        'Reglas de derivación y derivada logarítmica',
        'Derivada de la inversa, derivadas sucesivas y diferencial'
      ] },
      { name: 'Variación de funciones', topics: [
        'Teoremas de Weierstrass, Rolle y valor medio',
        'Extremos locales y absolutos',
        'Concavidad y puntos de inflexión',
        'Regla de L\'Hôpital',
        'Estudio completo de funciones y asíntotas'
      ] },
      { name: 'Primitivas y métodos de integración', topics: [
        'Primitiva e integral indefinida',
        'Sustitución y por partes',
        'Funciones racionales',
        'Integrales trigonométricas e irracionales'
      ] },
      { name: 'Integral definida', topics: [
        'Definición y propiedades',
        'Teorema fundamental y regla de Barrow',
        'Aplicaciones geométricas y físicas',
        'Integrales impropias'
      ] }
    ]
  },
  {
    id: 'unc-fcefyn-algebra-lineal',
    name: 'Álgebra Lineal',
    inst: 'UNC · FCEFyN (Córdoba)',
    keys: 'algebra lineal unc universidad nacional de cordoba fcefyn ingenieria',
    source: 'Programa oficial FCEFyN · cód. 10-04059',
    units: [
      { name: 'Sistemas de ecuaciones y matrices', topics: [
        'Operaciones con matrices',
        'Operaciones elementales, escalonada reducida y rango',
        'Método de Gauss y Rouché-Frobenius',
        'Matriz inversa',
        'Determinantes: Sarrus y cofactores'
      ] },
      { name: 'Vectores', topics: [
        'Vectores en R2, R3 y Rn',
        'Longitud, distancia y ángulo',
        'Producto punto y producto vectorial',
        'Recta y plano'
      ] },
      { name: 'Espacios vectoriales', topics: [
        'Espacios y subespacios',
        'Combinación lineal, suma e intersección de subespacios',
        'Independencia lineal, base y dimensión',
        'Coordenadas y cambio de base',
        'Producto interno, bases ortonormales y proyecciones'
      ] },
      { name: 'Valores y vectores propios', topics: [
        'Ecuación característica',
        'Diagonalización',
        'Matrices simétricas y diagonalización ortogonal'
      ] },
      { name: 'Aplicaciones lineales', topics: [
        'Definición y propiedades',
        'Núcleo, imagen y teorema de la dimensión',
        'Inyectivas y suryectivas',
        'Matriz de una aplicación lineal y operadores diagonalizables'
      ] }
    ]
  },
  {
    id: 'unc-fcefyn-fisica-1',
    name: 'Física 1',
    inst: 'UNC · FCEFyN (Córdoba)',
    keys: 'fisica 1 i unc universidad nacional de cordoba fcefyn ingenieria',
    source: 'Programa oficial FCEFyN · cód. 10-04060',
    units: [
      { name: 'Magnitudes', topics: [
        'Escalares y vectores: operaciones',
        'Componentes cartesianas y versores',
        'Teoría de errores'
      ] },
      { name: 'Estática', topics: [
        'Composición de fuerzas',
        'Momento de una fuerza y teorema de Varignon',
        'Centro de gravedad y cupla',
        'Condiciones de equilibrio'
      ] },
      { name: 'Cinemática', topics: [
        'MRU y MRUV',
        'Caída libre y tiro vertical',
        'Movimiento curvilíneo y tiro oblicuo',
        'Movimiento circular',
        'Movimiento relativo'
      ] },
      { name: 'Dinámica', topics: [
        'Leyes de la dinámica y cantidad de movimiento',
        'Rozamiento',
        'Trabajo, potencia y energía',
        'Conservación de la energía mecánica',
        'Colisiones',
        'Sistemas de partículas y centro de masa',
        'Rotación: momento de inercia y Steiner',
        'Momento cinético y efectos giroscópicos'
      ] },
      { name: 'Movimientos oscilatorios', topics: [
        'Movimiento armónico simple y su composición',
        'Péndulo simple, físico y de torsión'
      ] },
      { name: 'Gravitación', topics: [
        'Leyes de Kepler y gravitación universal',
        'Campo y potencial gravitatorio',
        'Velocidad orbital y de escape'
      ] },
      { name: 'Elasticidad', topics: [
        'Ley de Hooke',
        'Módulos de elasticidad y compresibilidad'
      ] },
      { name: 'Hidrostática e hidrodinámica', topics: [
        'Presión, Pascal y teorema de la hidrostática',
        'Arquímedes y flotación',
        'Tensión superficial y capilaridad',
        'Continuidad, Bernoulli y Torricelli',
        'Viscosidad'
      ] },
      { name: 'Termometría y dilatación', topics: [
        'Temperatura, calor y escalas',
        'Dilatación de sólidos',
        'Calor específico',
        'Gases: transformaciones, Boyle-Mariotte y Gay-Lussac'
      ] },
      { name: 'Fenómenos ondulatorios', topics: [
        'Ondas transversales y longitudinales',
        'Ondas sonoras',
        'Ondas estacionarias y efecto Doppler'
      ] }
    ]
  },

  // ======================= UNS (Bahía Blanca) =======================
  {
    id: 'uns-algebra-geometria-5539',
    name: 'Álgebra y Geometría',
    inst: 'UNS · Bahía Blanca',
    keys: 'algebra y geometria 5539 uns universidad nacional del sur bahia blanca ingenieria',
    source: 'Programa oficial Departamento de Matemática UNS · cód. 5539',
    units: [
      { name: 'Números complejos', topics: [
        'Forma binómica y operaciones',
        'Forma polar: producto, cociente, potencias y raíces'
      ] },
      { name: 'Polinomios', topics: [
        'Regla de Ruffini y teorema del resto',
        'Raíces y multiplicidad',
        'Teorema fundamental del álgebra y raíces racionales'
      ] },
      { name: 'Sistemas, matrices y determinantes', topics: [
        'Eliminación de Gauss',
        'Operaciones con matrices',
        'Determinantes',
        'Matriz inversa y regla de Cramer'
      ] },
      { name: 'Vectores', topics: [
        'Vectores, bases y coordenadas',
        'Producto escalar, vectorial y mixto'
      ] },
      { name: 'Geometría analítica en el plano y el espacio', topics: [
        'Recta en el plano y distancia a un punto',
        'Ecuación del plano',
        'Recta en el espacio y rectas alabeadas',
        'Distancias y ángulos entre rectas y planos'
      ] },
      { name: 'Espacios vectoriales', topics: [
        'Subespacios, intersección y generado',
        'Independencia lineal y bases'
      ] },
      { name: 'Cambios de base', topics: [
        'Matriz de cambio de base',
        'Producto interno y bases ortonormales'
      ] },
      { name: 'Transformaciones lineales', topics: [
        'Matriz asociada',
        'Matrices de una transformación en distintas bases'
      ] },
      { name: 'Autovalores y autovectores', topics: [
        'Cálculo de autovalores y autovectores',
        'Diagonalización y matrices simétricas'
      ] },
      { name: 'Cónicas y cuádricas', topics: [
        'Reducción a forma normal',
        'Clasificación y representación'
      ] }
    ]
  }
];
