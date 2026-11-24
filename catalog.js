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
  {
    id: 'uba-cbc-ipc-40',
    name: 'Introducción al Pensamiento Científico (40)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'ipc pensamiento cientifico 40 cbc uba xxi ubaxxi ciclo basico comun presencial normal regular ciencia de datos',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Modos de conocimiento', topics: [
        'Conocimiento tácito y explícito · lenguaje y metalenguaje',
        'Sentido común y conocimiento científico',
        'Ciencias formales y fácticas, sociales y humanidades',
        'Tipos de enunciados y condiciones de verdad',
        'Demostración',
        'Tipos de argumentos y cómo evaluarlos'
      ] },
      { name: 'Historia y estructura institucional de la ciencia', topics: [
        'Revoluciones copernicana y darwiniana',
        'Cambios en la visión del mundo y en el método',
        'Comunidades científicas e instituciones',
        'Producción y difusión del conocimiento científico'
      ] },
      { name: 'Contrastación de hipótesis', topics: [
        'Conceptos cualitativos, comparativos y cuantitativos',
        'Enunciados generales, singulares y probabilísticos',
        'Hipótesis auxiliares, ceteris paribus y condiciones iniciales',
        'Asimetría y holismo de la contrastación'
      ] },
      { name: 'Estructura y cambio de las teorías científicas', topics: [
        'Teorías como conjuntos de enunciados',
        'Observación y experimentación',
        'Ciencia normal y revoluciones científicas',
        'Criterio de demarcación y progreso científico',
        'Ciencia, tecnología, sociedad y ética'
      ] }
    ]
  },
  {
    id: 'uba-cbc-analisis-a-66',
    name: 'Análisis Matemático A (66)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'analisis matematico a 66 am matematica cbc uba xxi ubaxxi ciclo basico comun ingenieria exactas ciencia de datos computacion',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Funciones y números reales', topics: [
        'Funciones elementales y sus gráficos',
        'Composición y función inversa',
        'Exponenciales y logarítmicas',
        'Funciones trigonométricas',
        'Números reales: supremo, ínfimo y completitud'
      ] },
      { name: 'Sucesiones', topics: [
        'Límite de sucesiones y álgebra de límites',
        'Indeterminaciones',
        'Sucesiones monótonas y el número e',
        'Subsucesiones y sucesiones por recurrencia'
      ] },
      { name: 'Límite y continuidad', topics: [
        'Límites en un punto, laterales e infinitos',
        'Asíntotas horizontales y verticales',
        'Continuidad y discontinuidades',
        'Teoremas de Bolzano y de los valores intermedios'
      ] },
      { name: 'Derivadas', topics: [
        'Recta tangente y definición de derivada',
        'Reglas de derivación y regla de la cadena',
        'Derivada de la inversa',
        'Extremos absolutos y teorema de Fermat',
        'Teoremas de Rolle, Lagrange y Cauchy',
        'Regla de L\'Hôpital'
      ] },
      { name: 'Estudio de funciones y optimización', topics: [
        'Crecimiento, extremos locales y asíntotas oblicuas',
        'Concavidad y construcción de curvas',
        'Cantidad de soluciones y desigualdades',
        'Problemas de optimización',
        'Polinomio de Taylor y resto'
      ] },
      { name: 'Integrales', topics: [
        'Definición y propiedades de la integral',
        'Teorema fundamental y regla de Barrow',
        'Sustitución y por partes',
        'Área entre curvas',
        'Ecuaciones diferenciales'
      ] },
      { name: 'Series', topics: [
        'Sumas parciales: series geométricas y telescópicas',
        'Criterios de convergencia',
        'Series de potencias'
      ] }
    ]
  },
  {
    id: 'uba-cbc-algebra-a-62',
    name: 'Álgebra A (62)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'algebra a 62 matematica cbc uba xxi ubaxxi ciclo basico comun ingenieria exactas ciencia de datos computacion',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Conjuntos, complejos y polinomios', topics: [
        'Conjuntos y operaciones',
        'Números complejos: forma binómica, polar y exponencial',
        'Conjugación, traslaciones, homotecias y rotaciones',
        'Polinomios y algoritmo de división',
        'Teorema fundamental del álgebra y factorización'
      ] },
      { name: 'Álgebra vectorial', topics: [
        'Vectores en Rn y producto escalar',
        'Norma, ángulo y producto vectorial',
        'Rectas y planos',
        'Combinación lineal, dependencia y subespacio generado',
        'Distancias, proyecciones y simetrías'
      ] },
      { name: 'Sistemas lineales, matrices y determinantes', topics: [
        'Sistemas de ecuaciones y su interpretación geométrica',
        'Operaciones con matrices',
        'Eliminación de Gauss-Jordan',
        'Determinante y matriz inversa',
        'Matrices de 2×2 y 3×3 como transformaciones'
      ] },
      { name: 'Funciones lineales', topics: [
        'Transformaciones lineales y su matriz',
        'Imagen, preimagen y núcleo',
        'Interpretación geométrica del determinante',
        'Transformación inversa'
      ] },
      { name: 'Cónicas', topics: [
        'Ecuaciones canónicas',
        'Focos, centro, vértices, semiejes y excentricidad'
      ] }
    ]
  },
  {
    id: 'uba-cbc-biofisica-53',
    name: 'Física e Introducción a la Biofísica (53)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'fisica biofisica 53 cbc uba xxi ubaxxi ciclo basico comun medicina salud enfermeria kinesiologia nutricion odontologia farmacia bioquimica',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Introducción a la biomecánica', topics: [
        'Magnitudes y Sistema Internacional',
        'MRU y movimiento uniformemente acelerado',
        'Inercia, fuerza y gravedad',
        'Trabajo, energía y potencia',
        'Oscilaciones: frecuencia y período',
        'El cuerpo humano como estructura mecánica'
      ] },
      { name: 'Bases físicas de la circulación y la respiración', topics: [
        'Hidrostática: presión y principio de Pascal',
        'Gases: ecuación de estado y ley de Dalton',
        'Gases en solución, evaporación y humedad',
        'Hidrodinámica: continuidad y Bernoulli',
        'Viscosidad y ley de Poiseuille',
        'El aparato circulatorio como sistema tubular'
      ] },
      { name: 'Termodinámica de los seres vivos', topics: [
        'Calor, temperatura y escalas',
        'Primer principio de la termodinámica',
        'Sistemas abiertos, cerrados y aislados',
        'Entropía y segundo principio',
        'El cuerpo como sistema termodinámico'
      ] },
      { name: 'Bases fisicoquímicas de la vida', topics: [
        'Soluciones, molaridad y electrolitos',
        'Permeabilidad y gradientes',
        'Presión osmótica y ósmosis',
        'Membranas biológicas'
      ] },
      { name: 'Fenómenos bioeléctricos', topics: [
        'Carga, potencial y corriente eléctrica',
        'Resistencia, conductancia y capacidad',
        'Circuitos en medios sólidos y líquidos',
        'Bioelectricidad en el cuerpo humano'
      ] },
      { name: 'Señales en los seres vivos', topics: [
        'Fenómenos ondulatorios',
        'Luz y sonido: visión y audición'
      ] }
    ]
  },
  {
    id: 'uba-cbc-biologia',
    name: 'Biología',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'biologia 54 celular cbc uba xxi ubaxxi ciclo basico comun exactas agronomia veterinaria',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Organización de la materia viva', topics: [
        'Niveles de organización y teoría celular',
        'Microscopía y técnicas de estudio de la célula',
        'Células procariotas y eucariotas · virus',
        'Organización de la célula eucariota animal y vegetal'
      ] },
      { name: 'Composición química de los seres vivos', topics: [
        'Agua, iones y pequeñas moléculas',
        'Ácidos nucleicos: ADN y ARN',
        'Proteínas y enzimas',
        'Azúcares y lípidos'
      ] },
      { name: 'Superficie celular y endomembranas', topics: [
        'Membrana plasmática y modelo de mosaico fluido',
        'Permeabilidad activa y pasiva',
        'Receptores y comunicación celular',
        'Endocitosis y exocitosis',
        'Retículo endoplasmático y Golgi: secreción',
        'Citoesqueleto, cilios y flagelos'
      ] },
      { name: 'Digestión celular', topics: [
        'Lisosomas',
        'Peroxisomas y glioxisomas'
      ] },
      { name: 'Transducción de energía', topics: [
        'Mitocondrias: Krebs, cadena respiratoria y fosforilación',
        'Cloroplastos y fotosíntesis'
      ] },
      { name: 'Núcleo y ciclo celular', topics: [
        'Envoltura nuclear y cromatina',
        'Cromosomas y nucléolo',
        'Ciclo celular',
        'Duplicación del ADN'
      ] },
      { name: 'Transcripción', topics: [
        'Dogma central y transcripción',
        'Procesamiento de los ARN',
        'Ribosomas y código genético'
      ] },
      { name: 'Síntesis proteica', topics: [
        'Etapas de la traducción',
        'Destino de las proteínas y péptido señal',
        'Regulación genética en procariotas y eucariotas'
      ] },
      { name: 'División celular', topics: [
        'Mitosis',
        'Meiosis'
      ] },
      { name: 'Herencia', topics: [
        'Genes, alelos, genotipo y fenotipo',
        'Leyes de Mendel',
        'Ligamiento y recombinación',
        'Mutaciones y aberraciones cromosómicas'
      ] }
    ]
  },
  {
    id: 'uba-cbc-biologia-celular',
    name: 'Biología e Introducción a la Biología Celular',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'biologia celular introduccion 08 cbc uba xxi ubaxxi ciclo basico comun medicina salud enfermeria kinesiologia nutricion odontologia',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'La célula y la vida', topics: [
        'Biología celular en la salud · niveles de organización',
        'Diversidad y clasificación de los seres vivos',
        'Células procariotas y eucariotas',
        'Componentes químicos de la célula'
      ] },
      { name: 'Membrana, núcleo y citosol', topics: [
        'Membrana celular y transporte',
        'Señalización y reconocimiento',
        'Núcleo, cromatina y cromosomas',
        'Citosol, ribosomas y citoesqueleto'
      ] },
      { name: 'Endomembranas y organoides', topics: [
        'Retículo, Golgi, endosomas y lisosomas',
        'Biosíntesis, secreción y endocitosis',
        'Mitocondria, cloroplasto y peroxisoma'
      ] },
      { name: 'Información genética', topics: [
        'Código genético y transcripción',
        'Procesamiento del ARN y traducción'
      ] },
      { name: 'La célula y su entorno', topics: [
        'Señales intracelulares',
        'Uniones intercelulares y matriz extracelular'
      ] },
      { name: 'División, reproducción y herencia', topics: [
        'Ciclo celular, replicación y mitosis',
        'Apoptosis',
        'Reproducción, meiosis y fecundación',
        'Leyes de Mendel y bases químicas de la herencia'
      ] },
      { name: 'Evolución', topics: [
        'Biología de poblaciones',
        'Teorías y evidencias de la evolución',
        'Selección natural y origen de las especies'
      ] }
    ]
  },
  {
    id: 'uba-cbc-pensamiento-computacional',
    name: 'Pensamiento Computacional (90)',
    inst: 'UBA · CBC presencial y UBA XXI',
    keys: 'pensamiento computacional 90 programacion python cbc uba xxi ubaxxi ciclo basico comun ingenieria ciencia de datos computacion',
    source: 'Contenidos mínimos oficiales · Código UBA I-16, cap. D',
    units: [
      { name: 'Resolución de problemas', topics: [
        'Pensamiento computacional: descomposición y abstracción',
        'Algoritmos y programas'
      ] },
      { name: 'Programación', topics: [
        'Variables, expresiones y tipos de datos',
        'Estructuras de control: condicionales',
        'Estructuras de control: ciclos',
        'Funciones y programación modular',
        'Datos estructurados: listas y diccionarios'
      ] },
      { name: 'Datos y bibliotecas', topics: [
        'Archivos de texto',
        'Formatos de intercambio de datos',
        'Funciones predefinidas y bibliotecas'
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

  {
    "id": "utn-analisis-2",
    "name": "Análisis Matemático II",
    "inst": "UTN · FRBA, FRC y demás regionales",
    "keys": "analisis matematico 2 ii am2 utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria",
    "source": "Programa UTN FRBA 2023 · contenidos mínimos comunes a todas las regionales",
    "units": [
      {
        "name": "Funciones de varias variables: límite y continuidad",
        "topics": [
          "Topología en Rn: puntos y conjuntos",
          "Funciones escalares y vectoriales, dominio y conjuntos de nivel",
          "Límite, límites iterados y continuidad",
          "Curvas y superficies: ecuaciones vectoriales y paramétricas"
        ]
      },
      {
        "name": "Derivabilidad",
        "topics": [
          "Derivada de funciones vectoriales, recta tangente y plano normal",
          "Derivadas parciales y direccionales",
          "Derivadas sucesivas y teorema de Schwarz"
        ]
      },
      {
        "name": "Diferenciabilidad",
        "topics": [
          "Diferenciabilidad, gradiente y matriz jacobiana",
          "Plano tangente y recta normal a una superficie",
          "Propiedades del gradiente"
        ]
      },
      {
        "name": "Funciones compuestas e implícitas",
        "topics": [
          "Regla de la cadena",
          "Funciones implícitas: teorema de Dini",
          "Gradiente y conjuntos de nivel"
        ]
      },
      {
        "name": "Taylor y extremos",
        "topics": [
          "Fórmula de Taylor",
          "Extremos relativos y Hessiano",
          "Extremos ligados: multiplicadores de Lagrange"
        ]
      },
      {
        "name": "Integrales de línea",
        "topics": [
          "Longitud de arco",
          "Integral de línea y trabajo",
          "Independencia del camino y función potencial",
          "Rotor y campos conservativos"
        ]
      },
      {
        "name": "Integrales múltiples",
        "topics": [
          "Integrales dobles y triples",
          "Cambio de variables y coordenadas polares",
          "Coordenadas cilíndricas y esféricas"
        ]
      },
      {
        "name": "Integrales de superficie",
        "topics": [
          "Área de una superficie",
          "Superficies orientables y flujo"
        ]
      },
      {
        "name": "Teoremas integrales",
        "topics": [
          "Divergencia y teorema de Gauss",
          "Teorema de Green",
          "Teorema de Stokes"
        ]
      },
      {
        "name": "Ecuaciones diferenciales",
        "topics": [
          "EDO de primer orden: separables, lineales, homogéneas y exactas",
          "Líneas de campo y trayectorias ortogonales",
          "EDO de segundo orden con coeficientes constantes",
          "Variación de parámetros y coeficientes indeterminados",
          "Sistemas de ecuaciones diferenciales lineales"
        ]
      }
    ]
  },
  {
    "id": "utn-probabilidad-estadistica",
    "name": "Probabilidad y Estadística",
    "inst": "UTN · FRBA, FRC y demás regionales",
    "keys": "probabilidad y estadistica pye utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria",
    "source": "Programa UTN FRBA 2024 · contenidos mínimos comunes a todas las regionales",
    "units": [
      {
        "name": "Probabilidad",
        "topics": [
          "Experimentos aleatorios y espacio muestral",
          "Probabilidad laplaciana y axiomática",
          "Probabilidad condicional e independencia",
          "Probabilidad total y teorema de Bayes"
        ]
      },
      {
        "name": "Variable aleatoria",
        "topics": [
          "Variables discretas y continuas",
          "Función de probabilidad, densidad y distribución",
          "Esperanza, varianza y desvío",
          "Covarianza y correlación"
        ]
      },
      {
        "name": "Distribuciones especiales",
        "topics": [
          "Binomial y Poisson",
          "Uniforme y Gamma",
          "Distribución normal y uso de tablas"
        ]
      },
      {
        "name": "Estimación",
        "topics": [
          "Muestra aleatoria y estimadores",
          "Teorema central del límite",
          "Propiedades de los estimadores",
          "Intervalos de confianza para una población",
          "Intervalos de confianza para dos poblaciones"
        ]
      },
      {
        "name": "Prueba de hipótesis",
        "topics": [
          "Hipótesis y errores tipo I y II",
          "Pruebas para medias y prueba t de Student",
          "Prueba chi-cuadrado y pruebas de proporciones",
          "Valor p y significación estadística"
        ]
      },
      {
        "name": "Regresión y correlación",
        "topics": [
          "Regresión lineal simple y mínimos cuadrados",
          "Coeficiente de determinación",
          "Significación de la regresión y predicción"
        ]
      }
    ]
  },
  {
    "id": "utn-quimica-general",
    "name": "Química General",
    "inst": "UTN · FRBA, FRC y demás regionales",
    "keys": "quimica general utn tecnologica frba buenos aires frc cordoba frro rosario frm mendoza frt tucuman frlp la plata frbb bahia blanca frsf santa fe haedo avellaneda pacheco delta parana resistencia neuquen mar del plata villa maria san nicolas regional ingenieria",
    "source": "Programa UTN FRBA 2025",
    "units": [
      {
        "name": "Sistemas materiales",
        "topics": [
          "Propiedades intensivas y extensivas",
          "Sistemas homogéneos y heterogéneos",
          "Soluciones y métodos de fraccionamiento",
          "Sustancias puras, elementos y cambios"
        ]
      },
      {
        "name": "Estructura atómica y mol",
        "topics": [
          "Número atómico, isótopos y masa atómica",
          "Mol, número de Avogadro y volumen molar"
        ]
      },
      {
        "name": "Estado gaseoso",
        "topics": [
          "Teoría cinético-molecular",
          "Gases ideales y ecuación general",
          "Dalton, Graham y gases reales (van der Waals)"
        ]
      },
      {
        "name": "Reacciones y estequiometría",
        "topics": [
          "Ecuaciones químicas y balanceo",
          "Cálculos estequiométricos",
          "Reactivo limitante, pureza y rendimiento"
        ]
      },
      {
        "name": "Estructura electrónica y tabla periódica",
        "topics": [
          "Modelos atómicos y números cuánticos",
          "Configuración electrónica",
          "Tabla periódica y propiedades periódicas"
        ]
      },
      {
        "name": "Uniones químicas",
        "topics": [
          "Enlace covalente, iónico y metálico",
          "Fuerzas intermoleculares",
          "Número de oxidación y nomenclatura"
        ]
      },
      {
        "name": "Líquidos y sólidos",
        "topics": [
          "Presión de vapor, viscosidad y tensión superficial",
          "Sólidos amorfos y cristalinos",
          "Diagramas de fases"
        ]
      },
      {
        "name": "Soluciones",
        "topics": [
          "Concentración y solubilidad",
          "Ley de Henry",
          "Propiedades coligativas"
        ]
      },
      {
        "name": "Termoquímica",
        "topics": [
          "Primera ley y entalpía",
          "Ley de Hess y entalpías estándar",
          "Poder calorífico"
        ]
      },
      {
        "name": "Cinética y equilibrio",
        "topics": [
          "Velocidad de reacción y catálisis",
          "Equilibrio químico y Le Châtelier",
          "Equilibrio iónico, pH y pOH"
        ]
      },
      {
        "name": "Electroquímica",
        "topics": [
          "Redox: método ion-electrón",
          "Potenciales estándar y pilas",
          "Electrólisis y leyes de Faraday",
          "Corrosión"
        ]
      },
      {
        "name": "Química del ambiente",
        "topics": [
          "Contaminación del aire y efecto invernadero",
          "Contaminación del agua y agua potable",
          "Contaminación del suelo"
        ]
      }
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

  {
    "id": "unc-fcefyn-analisis-2",
    "name": "Análisis Matemático 2",
    "inst": "UNC · FCEFyN (Córdoba)",
    "keys": "analisis matematico 2 ii am2 unc universidad nacional de cordoba fcefyn ingenieria",
    "source": "Programa oficial FCEFyN · cód. 10-04063",
    "units": [
      {
        "name": "Cónicas y funciones de Rn en Rp",
        "topics": [
          "Secciones cónicas y coordenadas polares",
          "Topología en Rn",
          "Funciones de varias variables: dominio y representación"
        ]
      },
      {
        "name": "Límite y continuidad",
        "topics": [
          "Límite y límites iterados",
          "Continuidad"
        ]
      },
      {
        "name": "Derivadas y diferencial",
        "topics": [
          "Derivadas parciales y de orden superior",
          "Diferenciabilidad y plano tangente",
          "Matriz jacobiana y regla de la cadena",
          "Derivada direccional y gradiente"
        ]
      },
      {
        "name": "Extremos e integración múltiple",
        "topics": [
          "Taylor y extremos con Hessiano",
          "Multiplicadores de Lagrange",
          "Integrales dobles y triples",
          "Cambio de variables"
        ]
      },
      {
        "name": "Curvas e integrales de línea",
        "topics": [
          "Parametrización y longitud de arco",
          "Triedro de Frenet: curvatura y torsión",
          "Integrales de línea"
        ]
      },
      {
        "name": "Superficies e integrales de superficie",
        "topics": [
          "Parametrización y orientación",
          "Integrales de superficie"
        ]
      },
      {
        "name": "Campos vectoriales",
        "topics": [
          "Divergencia y rotor",
          "Campos conservativos y función potencial",
          "Teoremas de Green, Stokes y Gauss"
        ]
      },
      {
        "name": "Ecuaciones diferenciales ordinarias",
        "topics": [
          "Primer orden: separables, exactas y lineales",
          "Ecuación de Bernoulli",
          "Segundo orden con coeficientes constantes",
          "Sistemas de EDO lineales"
        ]
      }
    ]
  },
  {
    "id": "unc-fcefyn-analisis-3",
    "name": "Análisis Matemático 3",
    "inst": "UNC · FCEFyN (Córdoba)",
    "keys": "analisis matematico 3 iii am3 variable compleja fourier laplace unc universidad nacional de cordoba fcefyn ingenieria",
    "source": "Programa oficial FCEFyN · cód. 10-04070",
    "units": [
      {
        "name": "Variable compleja",
        "topics": [
          "Funciones complejas, límite y derivada",
          "Cauchy-Riemann, holomorfía y armonicidad",
          "Funciones elementales complejas",
          "Integración compleja y teorema de Cauchy",
          "Series de Taylor y Laurent",
          "Residuos y cálculo de integrales",
          "Transformaciones conformes"
        ]
      },
      {
        "name": "Series y transformadas",
        "topics": [
          "Series de Fourier",
          "Transformada de Fourier",
          "Transformada de Laplace",
          "Resolución de EDO con Laplace",
          "Soluciones por series: Legendre y Bessel",
          "Problemas de Sturm-Liouville"
        ]
      },
      {
        "name": "Ecuaciones en derivadas parciales",
        "topics": [
          "Clasificación y condiciones de contorno",
          "Separación de variables",
          "Ecuaciones de Laplace, del calor y de onda"
        ]
      },
      {
        "name": "Cálculo variacional",
        "topics": [
          "Funcionales y ecuación de Euler",
          "Extensiones de la ecuación de Euler"
        ]
      }
    ]
  },
  {
    "id": "unc-fcefyn-fisica-2",
    "name": "Física II",
    "inst": "UNC · FCEFyN (Córdoba)",
    "keys": "fisica 2 ii electricidad magnetismo optica unc universidad nacional de cordoba fcefyn geologia",
    "source": "Programa oficial FCEFyN (Ciencias Geológicas)",
    "units": [
      {
        "name": "Ondas",
        "topics": [
          "Ondas armónicas y ecuación de onda"
        ]
      },
      {
        "name": "Electrostática",
        "topics": [
          "Carga, ley de Coulomb y campo eléctrico",
          "Ley de Gauss",
          "Potencial eléctrico y superficies equipotenciales",
          "Dieléctricos y capacitores"
        ]
      },
      {
        "name": "Corriente y circuitos",
        "topics": [
          "Corriente, resistividad y ley de Ohm",
          "Fuerza electromotriz y potencia",
          "Reglas de Kirchhoff",
          "Circuitos RC e instrumentos de medición"
        ]
      },
      {
        "name": "Magnetismo",
        "topics": [
          "Fuerza magnética sobre cargas y corrientes",
          "Fuentes de campo magnético",
          "Propiedades magnéticas de la materia"
        ]
      },
      {
        "name": "Electromagnetismo",
        "topics": [
          "Inducción electromagnética e inductancia",
          "Ecuaciones de Maxwell y ondas electromagnéticas"
        ]
      },
      {
        "name": "Óptica",
        "topics": [
          "Naturaleza de la luz y óptica geométrica",
          "Óptica ondulatoria: interferencia, difracción y polarización"
        ]
      }
    ]
  },

  // ======================= UBA · carreras (después del CBC) =======================
  {
    "id": "uba-exactas-algebra-1",
    "name": "Álgebra I",
    "inst": "UBA · Exactas (carrera)",
    "keys": "algebra 1 i exactas fcen uba matematica computacion datos carrera",
    "source": "Programa oficial FCEN-UBA (2020)",
    "units": [
      {
        "name": "Conjuntos, relaciones y funciones",
        "topics": [
          "Conjuntos y operaciones · leyes de De Morgan",
          "Producto cartesiano y conjunto de partes",
          "Relaciones de orden y de equivalencia",
          "Funciones inyectivas, sobreyectivas y biyectivas"
        ]
      },
      {
        "name": "Naturales e inducción",
        "topics": [
          "Principio de inducción",
          "Sumatorias y productorias",
          "Factorial y combinatorios",
          "Recursión"
        ]
      },
      {
        "name": "Números enteros",
        "topics": [
          "Divisibilidad, algoritmo de división y bases",
          "MCD, algoritmo de Euclides y coprimos",
          "Primos y teorema fundamental de la aritmética",
          "Congruencias y ecuaciones diofánticas",
          "Teorema chino del resto",
          "Fermat, Euler-Fermat y RSA"
        ]
      },
      {
        "name": "Polinomios",
        "topics": [
          "Cuerpos y anillo de polinomios",
          "División, MCD y factorización única",
          "Raíces, teorema del resto y multiplicidad",
          "Polinomios en C[x] y R[x]"
        ]
      }
    ]
  },
  {
    "id": "uba-exactas-analisis-2",
    "name": "Análisis II",
    "inst": "UBA · Exactas (carrera)",
    "keys": "analisis 2 ii exactas fcen uba matematica fisica computacion datos carrera",
    "source": "Programa oficial FCEN-UBA (2020)",
    "units": [
      {
        "name": "Topología en R y Rn",
        "topics": [
          "Completitud de R y supremo",
          "Abiertos, cerrados y clausura",
          "Sucesiones en Rn"
        ]
      },
      {
        "name": "Funciones de Rn en Rk",
        "topics": [
          "Dominio, gráficos y conjuntos de nivel",
          "Límite y continuidad"
        ]
      },
      {
        "name": "Cálculo diferencial",
        "topics": [
          "Derivadas parciales y diferencial",
          "Matriz jacobiana y regla de la cadena",
          "Función inversa e implícita",
          "Gradiente y derivadas direccionales",
          "Hessiano y aproximación de orden 2"
        ]
      },
      {
        "name": "Extremos",
        "topics": [
          "Puntos críticos y formas cuadráticas",
          "Máximos, mínimos y puntos silla",
          "Multiplicadores de Lagrange"
        ]
      },
      {
        "name": "Integrales múltiples",
        "topics": [
          "Integrales impropias",
          "Integrales dobles y teorema de Fubini",
          "Integrales triples",
          "Cambio de variables"
        ]
      }
    ]
  },
  {
    "id": "uba-exactas-algebra-lineal",
    "name": "Álgebra Lineal",
    "inst": "UBA · Exactas (carrera)",
    "keys": "algebra lineal exactas fcen uba matematica carrera",
    "source": "Programa oficial FCEN-UBA (2020)",
    "units": [
      {
        "name": "Espacios vectoriales",
        "topics": [
          "Subespacios y generadores",
          "Independencia lineal, base y dimensión",
          "Suma y suma directa"
        ]
      },
      {
        "name": "Matrices",
        "topics": [
          "Álgebra de matrices e inversa",
          "Coordenadas y cambio de base"
        ]
      },
      {
        "name": "Transformaciones lineales",
        "topics": [
          "Núcleo, imagen y teorema de la dimensión",
          "Matriz de una transformación y rango",
          "Equivalencia y semejanza"
        ]
      },
      {
        "name": "Espacio dual",
        "topics": [
          "Base dual y anulador",
          "Función transpuesta"
        ]
      },
      {
        "name": "Determinante",
        "topics": [
          "Definición como forma multilineal alternada",
          "Propiedades, adjunta y regla de Cramer"
        ]
      },
      {
        "name": "Diagonalización",
        "topics": [
          "Autovalores y polinomio característico",
          "Polinomio minimal y Hamilton-Cayley",
          "Subespacios invariantes"
        ]
      },
      {
        "name": "Forma de Jordan",
        "topics": [
          "Nilpotentes",
          "Forma de Jordan general y potencias"
        ]
      },
      {
        "name": "Producto interno",
        "topics": [
          "Gram-Schmidt y proyecciones",
          "Adjunta, autoadjuntas, unitarias y ortogonales"
        ]
      }
    ]
  },
  {
    "id": "uba-exactas-calculo-numerico",
    "name": "Cálculo Numérico",
    "inst": "UBA · Exactas (carrera)",
    "keys": "calculo numerico metodos numericos exactas fcen uba computacion datos fisica carrera",
    "source": "Programa oficial FCEN-UBA (2020)",
    "units": [
      {
        "name": "Aritmética de punto flotante",
        "topics": [
          "Representación y errores de redondeo",
          "Propagación de errores y condicionamiento"
        ]
      },
      {
        "name": "Sistemas lineales",
        "topics": [
          "Normas y condicionamiento de matrices",
          "Gauss, pivoteo y LU",
          "Cholesky",
          "Jacobi, Gauss-Seidel y SOR",
          "Método de las potencias"
        ]
      },
      {
        "name": "Ecuaciones no lineales",
        "topics": [
          "Bisección",
          "Newton, secante y regula falsi",
          "Punto fijo"
        ]
      },
      {
        "name": "Interpolación",
        "topics": [
          "Lagrange y Newton",
          "Error y Hermite",
          "Polinomios de Chebyshev"
        ]
      },
      {
        "name": "Cuadrados mínimos",
        "topics": [
          "Polinomios ortogonales",
          "QR y Gram-Schmidt",
          "Valores singulares (SVD)"
        ]
      },
      {
        "name": "Integración numérica",
        "topics": [
          "Trapecio y Simpson",
          "Reglas compuestas y cuadratura de Gauss"
        ]
      },
      {
        "name": "Ecuaciones diferenciales",
        "topics": [
          "Euler explícito e implícito",
          "Runge-Kutta",
          "Métodos multipaso y estabilidad"
        ]
      }
    ]
  },
  {
    "id": "uba-exactas-matematica-1-bio",
    "name": "Matemática I (Biológicas)",
    "inst": "UBA · Exactas (carrera)",
    "keys": "matematica 1 i biologicas biologia exactas fcen uba carrera",
    "source": "Programa oficial FCEN-UBA (2020)",
    "units": [
      {
        "name": "Vectores y números complejos",
        "topics": [
          "Vectores, producto escalar y vectorial",
          "Complejos: forma binómica y polar",
          "De Moivre y raíces"
        ]
      },
      {
        "name": "Sistemas lineales y matrices",
        "topics": [
          "Gauss y rango",
          "Matrices y determinantes",
          "Autovalores, autovectores y diagonalización"
        ]
      },
      {
        "name": "Funciones de 2 y 3 variables",
        "topics": [
          "Funciones vectoriales de una variable",
          "Funciones escalares y conjuntos de nivel"
        ]
      },
      {
        "name": "Diferenciación",
        "topics": [
          "Derivadas parciales y gradiente",
          "Plano tangente y regla de la cadena",
          "Derivadas direccionales"
        ]
      },
      {
        "name": "Aproximación por polinomios",
        "topics": [
          "Polinomio de Taylor"
        ]
      },
      {
        "name": "Extremos",
        "topics": [
          "Máximos y mínimos de funciones de varias variables"
        ]
      },
      {
        "name": "Ecuaciones diferenciales",
        "topics": [
          "EDO de primer orden",
          "Sistemas lineales de primer orden",
          "Sistemas no lineales de primer orden"
        ]
      }
    ]
  },
  {
    "id": "uba-fmed-anatomia-kinesio",
    "name": "Anatomía (Kinesiología)",
    "inst": "UBA · Medicina (carrera)",
    "keys": "anatomia kinesiologia fisiatria medicina fmed uba salud carrera",
    "source": "Programa oficial Facultad de Medicina UBA 2026 · Lic. en Kinesiología y Fisiatría",
    "units": [
      {
        "name": "Generalidades",
        "topics": [
          "Introducción a la anatomía humana",
          "Osteología",
          "Artrología",
          "Miología"
        ]
      },
      {
        "name": "Cabeza, cuello y tronco",
        "topics": [
          "Cabeza y cuello: neurocráneo y esplacnocráneo",
          "Tronco: sistema osteoarticular",
          "Cabeza y cuello: músculos, vasos y nervios",
          "Músculos del raquis",
          "Paredes del tórax y del abdomen"
        ]
      },
      {
        "name": "Extremidad superior",
        "topics": [
          "Huesos y articulaciones",
          "Músculos",
          "Vasos y nervios"
        ]
      },
      {
        "name": "Extremidad inferior",
        "topics": [
          "Huesos y articulaciones",
          "Músculos",
          "Vasos y nervios"
        ]
      },
      {
        "name": "Esplacnología",
        "topics": [
          "Sistema fonorrespiratorio",
          "Sistema circulatorio",
          "Sistema digestivo",
          "Sistemas urinario, genital y endocrino"
        ]
      },
      {
        "name": "Neuroanatomía",
        "topics": [
          "Generalidades del sistema nervioso",
          "Médula y tronco encefálico",
          "Cerebelo y cerebro",
          "Vías de conducción y órganos de los sentidos"
        ]
      }
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
