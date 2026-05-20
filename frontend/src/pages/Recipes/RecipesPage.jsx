import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const RECIPE_DB = [
  { id: 'r1', name: 'Pollo al horno con verduras', category: 'comida', time: '50 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Patatas', 'Zanahoria', 'Aceite de oliva', 'Sal', 'Pimienta', 'Ajo'], instructions: '1. Precalienta el horno a 200°C con calor arriba y abajo (10-15 minutos para precalentar). Mientras tanto, prepara todos los ingredientes sobre la encimera.\n2. Sazona el pollo (2 minutos): espolvorea sal, pimienta negra recién molida y ajo picado fino por toda la superficie. Frota bien con las manos para que las especias se adhieran a la carne.\n3. Pela las patatas (4 minutos) y córtalas en gajos medianos de unos 3 cm. Pela las zanahorias (2 minutos) y córtalas en rodajas gruesas de 1 cm de grosor.\n4. Monta la bandeja (3 minutos): coloca el pollo y las verduras en una bandeja de horno grande. Rocía con 4 cucharadas de aceite de oliva virgen extra y mezcla bien con las manos para que todo quede impregnado.\n5. Hornea a 200°C durante 45-50 minutos. A mitad de cocción (minuto 25), abre el horno, da la vuelta al pollo con unas pinzas y remueve las verduras para que se doren de forma uniforme.\n6. Comprueba la cocción (1 minuto): pincha el pollo en la parte más gruesa con un cuchillo. Si los jugos salen claros y transparentes está listo; si salen rosados, hornea 5-10 minutos más.\n7. Deja reposar 5 minutos fuera del horno. Este reposo permite que los jugos se redistribuyan por toda la carne, quedando más jugosa y tierna al servir.' },
  { id: 'r2', name: 'Ensalada César', category: 'almuerzo', time: '20 min', difficulty: 'Fácil', ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso parmesano', 'Aceite de oliva', 'Limón', 'Ajo', 'Mostaza'], instructions: '1. Sazona la pechuga de pollo con sal y pimienta (1 minuto). Cocínala en una plancha o sartén con un chorrito de aceite a fuego medio-alto, 4 minutos por cada lado. Deja reposar 2 minutos y corta en tiras finas.\n2. Corta el pan en cubos pequeños de 1 cm (2 minutos). Rocíalos con aceite de oliva y hornéalos a 180°C durante 8 minutos o hasta que estén dorados y crujientes. Vigila que no se quemen los últimos 2 minutos.\n3. Prepara el aliño (3 minutos): en un bol mezcla 4 cucharadas de aceite de oliva virgen extra, el zumo de medio limón, un diente de ajo muy picado, una cucharadita de mostaza de Dijon y sal al gusto. Bate con un tenedor durante 30 segundos hasta que emulsione y espese ligeramente.\n4. Lava y seca bien la lechuga (2 minutos). Córtala en trozos grandes con las manos y colócala en una ensaladera amplia.\n5. Monta la ensalada (2 minutos): distribuye el pollo en tiras, los crutones caseros y el queso parmesano laminado o rallado grueso sobre la lechuga.\n6. Vierte el aliño por encima justo antes de servir (1 minuto) y mezcla bien con las manos limpias o con dos tenedores para que todos los ingredientes se impregnen del aliño.' },
  { id: 'r3', name: 'Tacos de pescado', category: 'cena', time: '25 min', difficulty: 'Media', ingredients: ['Pescado blanco', 'Tortillas de maíz', 'Col', 'Crema agria', 'Limón', 'Aguacate', 'Cebolla', 'Cilantro'], instructions: '1. Corta el pescado blanco en tiras de unos 3 cm (2 minutos). Sazónalo con sal, pimienta negra recién molida y el zumo de medio limón. Deja marinar 5 minutos mientras preparas los demás ingredientes.\n2. Calienta una sartén antiadherente a fuego medio-alto con un chorrito de aceite (1 minuto). Cocina el pescado 2-3 minutos por cada lado hasta que esté opaco, dorado y se desmenuce fácilmente con un tenedor.\n3. Calienta las tortillas de maíz directamente sobre el fuego o en una sartén seca (2 minutos en total), unos 30 segundos por cada lado, hasta que estén ligeramente tostadas y flexibles.\n4. Prepara los vegetales (5 minutos): pica la col finamente en juliana, corta el aguacate en láminas finas y la cebolla en juliana fina. Pica un puñado de cilantro fresco.\n5. Prepara la crema agria (1 minuto): mezcla 3 cucharadas de nata o crema agria con el zumo de medio limón y una pizca de sal. Remueve hasta integrar.\n6. Monta los tacos (3 minutos): coloca el pescado sobre cada tortilla, añade col, aguacate, cebolla, cilantro fresco y un chorrito de crema agria. Sirve inmediatamente.' },
  { id: 'r4', name: 'Smoothie verde', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Espinacas', 'Plátano', 'Manzana', 'Jengibre', 'Agua', 'Miel'], instructions: '1. Lava bien las espinacas frescas y la manzana (1 minuto). No es necesario secarlas, el agua sobrante en las hojas ayuda a la textura del smoothie.\n2. Pela el plátano (30 segundos) y córtalo en rodajas. Corta la manzana en cuartos sin pelar — la piel aporta fibra y nutrientes extra.\n3. Pela un trozo pequeño de jengibre fresco de unos 2 cm (30 segundos) y córtalo en láminas finas para que se triture mejor.\n4. Añade todos los ingredientes a la licuadora (1 minuto): espinacas, plátano, manzana, jengibre, un vaso de agua fría y una cucharada de miel.\n5. Licúa a máxima potencia durante 30-45 segundos hasta que la textura sea completamente homogénea, cremosa y sin grumos.\n6. Prueba (30 segundos) y ajusta el dulzor con más miel si lo deseas. Sirve inmediatamente en un vaso grande — los smoothies se oxidan rápido y pierden nutrientes con el tiempo.' },
  { id: 'r5', name: 'Omelette de espinacas', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Espinacas', 'Tomate', 'Queso', 'Aceite de oliva', 'Sal'], instructions: '1. Lava las espinacas frescas y escúrrelas bien (2 minutos). Corta el tomate en dados pequeños de 1 cm.\n2. En un bol, bate 3 huevos con una pizca de sal (1 minuto) hasta que las claras y las yemas estén completamente integradas y aparezca algo de espuma en la superficie.\n3. Calienta una sartén antiadherente con una cucharada de aceite de oliva a fuego medio (1 minuto).\n4. Saltea las espinacas y el tomate durante 2 minutos, removiendo constantemente, hasta que las espinacas hayan reducido su volumen y estén tiernas.\n5. Vierte los huevos batidos sobre las verduras y distribúyelos uniformemente por toda la sartén inclinándola ligeramente.\n6. Añade el queso rallado por encima y cocina a fuego bajo 3-4 minutos hasta que los bordes comiencen a despegarse solos y el centro esté cuajado pero aún jugoso.\n7. Dobla la tortilla por la mitad con una espátula (1 minuto) y desliza a un plato. Sirve caliente inmediatamente.' },
  { id: 'r6', name: 'Pasta primavera', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Ajo', 'Aceite de oliva', 'Albahaca', 'Sal'], instructions: '1. Pon una olla grande con agua abundante a hervir (5 minutos hasta ebullición). Cuando hierva, añade sal gruesa y 300 g de pasta. Cocina según el tiempo indicado en el paquete (10-12 minutos) para que quede al dente.\n2. Mientras se calienta el agua, lava y corta el calabacín y la berenjena en cubos medianos (3 minutos). Corta los tomates en cuartos.\n3. Calienta 3 cucharadas de aceite de oliva en una sartén grande a fuego medio. Añade 2 dientes de ajo laminados y saltea 1 minuto hasta que estén fragantes pero sin quemarse.\n4. Incorpora la berenjena primero (necesita más cocción) y saltéala 3 minutos removiendo. Luego añade el calabacín y el tomate.\n5. Saltea las verduras durante 8-10 minutos a fuego medio-alto, removiendo de vez en cuando, hasta que estén tiernas pero aún firmes y ligeramente doradas en los bordes.\n6. Escurre la pasta (1 minuto) reservando medio vaso del agua de cocción. Mézclala con las verduras en la sartén a fuego bajo.\n7. Añade hojas de albahaca fresca rotas con las manos (1 minuto), un chorrito de aceite de oliva virgen extra crudo y un poco del agua reservada si la mezcla está demasiado seca. Sirve caliente.' },
  { id: 'r7', name: 'Arroz con pollo', category: 'comida', time: '40 min', difficulty: 'Media', ingredients: ['Arroz', 'Pollo', 'Cebolla', 'Ajo', 'Pimiento', 'Caldo de pollo', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Corta el pollo en trozos medianos (3 minutos) y sazónalos con sal y pimienta. Calienta 3 cucharadas de aceite en una olla grande a fuego medio-alto y dora el pollo por todos lados durante 5-6 minutos. Retíralo y resérvalo en un plato.\n2. En la misma olla, añade la cebolla picada fina, 3 dientes de ajo picados y el pimiento rojo en tiras. Sofríe 5 minutos a fuego medio hasta que estén transparentes y ligeramente dorados.\n3. Añade 2 tazas de arroz de grano medio y remueve durante 2 minutos para que el arroz se impregne de los sabores y se vuelva ligeramente translúcido.\n4. Vierte 4 tazas de caldo de pollo caliente (el doble que de arroz) y vuelve a colocar el pollo reservado en la olla.\n5. Sazona con sal, pimienta y una pizca de azafrán o cúrcuma para dar color (1 minuto). Lleva a ebullición a fuego alto.\n6. Baja el fuego al mínimo, tapa la olla hermética y cocina 18-20 minutos sin destapar ni remover bajo ninguna circunstancia.\n7. Apaga el fuego y deja reposar tapado 5 minutos. Destapa, remueve suavemente con un tenedor para soltar los granos y sirve caliente.' },
  { id: 'r8', name: 'Hamburguesa casera', category: 'cena', time: '20 min', difficulty: 'Fácil', ingredients: ['Carne picada', 'Pan de hamburguesa', 'Lechuga', 'Tomate', 'Queso cheddar', 'Cebolla', 'Mostaza', 'Ketchup'], instructions: '1. Prepara la carne (3 minutos): en un bol, mezcla 400 g de carne picada con sal y pimienta al gusto. Si quieres más jugosidad, añade una cucharada de agua fría y mezcla con las manos.\n2. Forma las hamburguesas (2 minutos): divide la carne en 4 porciones iguales y forma hamburguesas con las manos ligeramente humedecidas. Haz un pequeño hueco en el centro con el pulgar para que no se inchten al cocinarse.\n3. Calienta una plancha o sartén a fuego alto (2 minutos). Cocina las hamburguesas 4 minutos por cada lado para un punto jugoso, o 5-6 minutos si las prefieres más hechas. No las aplastes mientras se cocinan.\n4. Coloca una loncha de queso cheddar sobre cada hamburguesa en el último minuto de cocción y tapa la sartén para que se funda con el vapor.\n5. Tuesta los panes de hamburguesa en la misma plancha (1 minuto), unos 30 segundos por la cara cortada, hasta que estén ligeramente dorados.\n6. Monta la hamburguesa (3 minutos): pan inferior, hojas de lechuga, la hamburguesa con queso fundido, rodajas de tomate, aros de cebolla, mostaza y ketchup al gusto. Tapa con el pan superior y sirve inmediatamente.' },
  { id: 'r9', name: 'Tortilla de patatas', category: 'comida', time: '35 min', difficulty: 'Media', ingredients: ['Patatas', 'Huevos', 'Cebolla', 'Aceite de oliva', 'Sal'], instructions: '1. Pela 4 patatas medianas (4 minutos) y córtalas en rodajas finas de unos 3 mm, no en cubos. El corte fino ayuda a que se cocinen uniformemente.\n2. Pela una cebolla grande (1 minuto) y córtala en juliana fina.\n3. Calienta abundante aceite de oliva en una sartén profunda a fuego medio (2 minutos). Añade las patatas y la cebolla con cuidado.\n4. Cocina a fuego medio-bajo durante 20-25 minutos, removiendo de vez en cuando con una espátula, hasta que las patatas estén tiernas pero no doradas. Escurre el exceso de aceite en un colador.\n5. Bate 6 huevos grandes con una pizca de sal en un bol grande (1 minuto). Añade las patatas y cebolla escurridas y mezcla bien con una cuchara de madera.\n6. Calienta un par de cucharadas del aceite reservado en una sartén antiadherente pequeña a fuego medio-alto (1 minuto). Vierte la mezcla y distribúyela uniformemente.\n7. Cuando la base esté dorada (unos 3 minutos), dale la vuelta con ayuda de un plato llano o una tapa. Cocina 3 minutos más por el otro lado.\n8. La tortilla debe quedar jugosa por dentro (1 minuto). Si la prefieres más cuajada, cocina 1-2 minutos más por cada lado. Sirve caliente o a temperatura ambiente.' },
  { id: 'r10', name: 'Gazpacho andaluz', category: 'almuerzo', time: '15 min', difficulty: 'Fácil', ingredients: ['Tomate', 'Pimiento', 'Pepino', 'Ajo', 'Pan', 'Aceite de oliva', 'Vinagre', 'Sal', 'Agua'], instructions: '1. Lava bien todos los vegetales (3 minutos). Trocea los tomates maduros en cuartos, el pimiento verde en tiras grandes, el pepino pelado en rodajas y la cebolla en trozos.\n2. Remoja 2 rebanadas de pan duro o del día anterior en un poco de agua (5 minutos) para que se ablanden y aporten cremosidad.\n3. En una batidora o robot de cocina, coloca todos los vegetales troceados, el pan remojado bien escurrido, un diente de ajo pequeño, sal al gusto, 4 cucharadas de aceite de oliva virgen extra y 2 cucharadas de vinagre de Jerez.\n4. Tritura a máxima potencia durante 2-3 minutos hasta conseguir una textura muy fina, cremosa y sin grumos.\n5. Añade agua fría hasta la consistencia deseada (unos 200-300 ml) y vuelve a triturar 30 segundos para integrar.\n6. Prueba (1 minuto) y ajusta de sal y vinagre según tu preferencia. Cuanto más tiempo repose en la nevera, más se intensifican los sabores.\n7. Refrigera al menos 2 horas antes de servir. Sirve bien frío en cuencos o vasos, con trocitos de verduras frescas (pepino, tomate, pimiento) por encima como guarnición.' },
  { id: 'r11', name: 'Crema de calabaza', category: 'comida', time: '35 min', difficulty: 'Fácil', ingredients: ['Calabaza', 'Cebolla', 'Ajo', 'Caldo de verduras', 'Nata', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Pela la calabaza con un pelador o cuchillo (5 minutos), retira las semillas con una cuchara y córtala en cubos de unos 3 cm.\n2. Pela y pica la cebolla en juliana (2 minutos) y los dientes de ajo en láminas finas.\n3. En una olla grande, calienta 3 cucharadas de aceite de oliva a fuego medio. Sofríe la cebolla y el ajo 5 minutos hasta que estén transparentes y comiencen a dorarse ligeramente.\n4. Añade los cubos de calabaza y remueve 2 minutos para que se impregnen del aceite y los aromas.\n5. Cubre con caldo de verduras caliente (unos 500 ml) hasta sobrepasar la calabaza por 2 cm. Sazona con sal y pimienta.\n6. Lleva a ebullición, baja el fuego y cocina tapado 25 minutos hasta que la calabaza esté muy tierna (se pinche fácilmente con un cuchillo).\n7. Tritura la crema con una batidora de mano o de vaso (2 minutos) hasta obtener una textura sedosa y sin grumos.\n8. Añade 100 ml de nata líquida, mezcla bien y calienta 2 minutos más sin que hierva. Sirve caliente con un chorrito de aceite de oliva y semillas de calabaza tostadas.' },
  { id: 'r12', name: 'Salmón al horno', category: 'cena', time: '25 min', difficulty: 'Fácil', ingredients: ['Salmón', 'Limón', 'Eneldo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Patatas'], instructions: '1. Precalienta el horno a 180°C con calor arriba y abajo (10-15 minutos para precalentar).\n2. Pela las patatas (3 minutos) y córtalas en rodajas finas de unos 3 mm. Hiérvelas en agua con sal 5 minutos para ablandarlas ligeramente antes de hornear.\n3. Prepara el salmón (2 minutos): coloca el salmón en una bandeja de horno con la piel hacia abajo. Si tiene espinas, retíralas con unas pinzas de cocina.\n4. Sazona el salmón (1 minuto): añade sal, pimienta negra recién molida, el zumo de medio limón y eneldo fresco o seco espolvoreado generosamente por encima.\n5. Distribuye las patatas escurridas alrededor del salmón en la bandeja. Rocía todo con un chorro generoso de aceite de oliva virgen extra.\n6. Hornea 20 minutos (para un punto jugoso) o 25 minutos si lo prefieres más hecho. El salmón debe estar opaco y desmenuzarse fácilmente con un tenedor.\n7. Sirve inmediatamente (1 minuto) con una rodaja de limón fresco y eneldo adicional por encima.' },
  { id: 'r13', name: 'Ensalada de quinoa', category: 'almuerzo', time: '25 min', difficulty: 'Fácil', ingredients: ['Quinoa', 'Pepino', 'Tomate', 'Cebolla', 'Aguacate', 'Limón', 'Aceite de oliva', 'Sal'], instructions: '1. Enjuaga la quinoa bajo agua fría en un colador fino (1 minuto) para eliminar el sabor amargo natural de la saponina.\n2. Cocina la quinoa en una cacerola con el doble de agua y una pizca de sal. Lleva a ebullición, baja el fuego, tapa y cocina 15 minutos. Retira del fuego y deja reposar tapada 5 minutos más.\n3. Deja enfriar la quinoa (5 minutos) extendiéndola en una bandeja para que no se apelmace y suelte el vapor.\n4. Corta el pepino en dados pequeños sin pelar (2 minutos), los tomates en cubos y la cebolla morada en juliana muy fina.\n5. Pela el aguacate (1 minuto), retira el hueso y córtalo en dados. Rocíalo con un poco de zumo de limón para que no se oxide.\n6. En un bol grande, mezcla la quinoa fría con todas las verduras y el aguacate (2 minutos).\n7. Aliña con el zumo de un limón, 3 cucharadas de aceite de oliva virgen extra, sal al gusto y un toque de pimienta negra (2 minutos). Mezcla suavemente y sirve.' },
  { id: 'r14', name: 'Fajitas de pollo', category: 'cena', time: '25 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Tortillas de trigo', 'Pimiento', 'Cebolla', 'Comino', 'Pimentón', 'Limón', 'Aguacate'], instructions: '1. Corta las pechugas de pollo en tiras finas de unos 2 cm de ancho (3 minutos).\n2. Prepara la marinada (2 minutos): mezcla el zumo de medio limón, una cucharadita de comino molido, otra de pimentón dulce, sal y pimienta. Frota las tiras de pollo con esta mezcla y deja reposar 5 minutos mientras cortas las verduras.\n3. Corta los pimientos (rojo y verde) y la cebolla en tiras del mismo tamaño que el pollo (3 minutos).\n4. Calienta una sartén grande o wok a fuego alto con un chorro de aceite (1 minuto). Cocina el pollo 4-5 minutos removiendo constantemente hasta que esté dorado. Retíralo y resérvalo.\n5. En la misma sartén, saltea los pimientos y la cebolla 4 minutos a fuego medio-alto hasta que estén tiernos pero aún crujientes.\n6. Vuelve a incorporar el pollo a la sartén, mezcla con las verduras y calienta 1 minuto más para integrar los sabores.\n7. Calienta las tortillas en una sartén seca (2 minutos), unos 30 segundos por lado. Rellénalas con la mezcla de pollo y verduras, añade tiras de aguacate y un chorrito de lima.' },
  { id: 'r15', name: 'Macarrones con tomate', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Macarrones', 'Tomate triturado', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Queso rallado', 'Sal', 'Orégano'], instructions: '1. Pon una olla grande con agua a hervir (5 minutos hasta ebullición). Cuando hierva, añade sal generosa y 300 g de macarrones. Cocínalos según el tiempo del paquete (unos 10-12 minutos) hasta que estén al dente.\n2. Mientras se cocina la pasta, prepara la salsa: pica finamente media cebolla y 2 dientes de ajo (2 minutos).\n3. Calienta 3 cucharadas de aceite de oliva en una sartén a fuego medio. Sofríe la cebolla 4 minutos hasta que esté dorada, luego añade el ajo y cocina 1 minuto más.\n4. Vierte 400 g de tomate triturado, añade una cucharadita de orégano seco, sal y pimienta al gusto.\n5. Cocina la salsa a fuego medio-bajo durante 15 minutos, removiendo de vez en cuando, para que el tomate reduzca y concentre su sabor.\n6. Escurre los macarrones (1 minuto) reservando un poco de agua de cocción. Mézclalos con la salsa de tomate en la misma sartén a fuego bajo.\n7. Sirve caliente (1 minuto) con queso rallado (parmesano o mozzarella) por encima. Si la salsa queda muy espesa, añade un poco del agua de cocción reservada.' },
  { id: 'r16', name: 'Revuelto de champiñones', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Champiñones', 'Ajo', 'Perejil', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Limpia los champiñones con un paño húmedo o un cepillo suave (2 minutos) — no los laves bajo el agua porque se empapan y pierden sabor. Córtalos en láminas de unos 3 mm.\n2. Pela 2 dientes de ajo (30 segundos) y córtalos en láminas finas. Pica un puñado de perejil fresco.\n3. Calienta una sartén antiadherente con 2 cucharadas de aceite de oliva a fuego medio-alto (1 minuto).\n4. Saltea los champiñones con el ajo durante 4-5 minutos, removiendo de vez en cuando, hasta que estén dorados y hayan soltado y evaporado toda su agua.\n5. En un bol, bate 4 huevos con sal, pimienta negra recién molida y el perejil picado (1 minuto).\n6. Baja el fuego a medio y vierte los huevos batidos sobre los champiñones. Remueve suavemente con una espátula de madera.\n7. Cocina 2-3 minutos, removiendo constantemente, hasta que el huevo esté cuajado pero todavía cremoso y húmedo (no seco).\n8. Sirve inmediatamente sobre una rebanada de pan tostado (1 minuto), con más perejil fresco por encima.' },
  { id: 'r17', name: 'Lentejas estofadas', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Lentejas', 'Zanahoria', 'Patata', 'Cebolla', 'Ajo', 'Tomate', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Si usas lentejas secas, lávalas bajo agua fría y remójalas 30 minutos (opcional pero acelera la cocción). Si son de bote, escúrrelas y lávalas bajo el grifo.\n2. Pela y pica la cebolla en brunoise (3 minutos), los ajos en láminas, la zanahoria en rodajas y la patata en cubos medianos de 2 cm.\n3. En una olla grande, calienta 4 cucharadas de aceite de oliva a fuego medio. Sofríe la cebolla, el ajo y la zanahoria durante 5 minutos hasta que estén blandos y ligeramente dorados.\n4. Añade el tomate rallado o triturado y una cucharadita de pimentón dulce. Remueve 2 minutos para integrar los sabores y cocinar el tomate.\n5. Incorpora las lentejas escurridas, la patata y cubre con agua fría (unos 2 cm por encima de las lentejas, aproximadamente 1 litro).\n6. Sazona con sal (al final para que no endurezca las lentejas) y pimienta. Añade una hoja de laurel si tienes.\n7. Lleva a ebullición, baja el fuego a medio-bajo, tapa parcialmente y cocina 35-40 minutos removiendo de vez en cuando para que no se peguen.\n8. Las lentejas deben estar tiernas pero enteras, y el caldo ligeramente espeso (1 minuto). Rectifica de sal antes de servir.' },
  { id: 'r18', name: 'Wrap de atún', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Tortillas de trigo', 'Atún en lata', 'Lechuga', 'Tomate', 'Mayonesa', 'Maíz dulce', 'Sal'], instructions: '1. Escurre bien el atún en lata con un tenedor (1 minuto), presionando para eliminar el exceso de aceite o agua.\n2. En un bol, mezcla el atún con 2 cucharadas de mayonesa, el maíz dulce escurrido y una pizca de sal (2 minutos). Remueve hasta que esté bien integrado y cremoso.\n3. Lava y seca las hojas de lechuga (1 minuto). Corta el tomate en rodajas finas.\n4. Calienta las tortillas de trigo en una sartén seca (1 minuto), unos 20 segundos por lado, para que sean más flexibles y no se rompan al enrollarlas.\n5. Extiende la tortilla sobre una superficie limpia. Coloca las hojas de lechuga en el centro.\n6. Distribuye la mezcla de atún sobre la lechuga y añade las rodajas de tomate (1 minuto).\n7. Enrolla el wrap (1 minuto): dobla los lados hacia dentro y luego enrolla firmemente desde la parte inferior hacia arriba.\n8. Corta por la mitad en diagonal (30 segundos) y sirve inmediatamente. Puedes fijarlo con un palillo si es necesario.' },
  { id: 'r19', name: 'Patatas bravas', category: 'cena', time: '30 min', difficulty: 'Media', ingredients: ['Patatas', 'Tomate', 'Ajo', 'Pimentón picante', 'Vinagre', 'Aceite de oliva', 'Sal', 'Harina'], instructions: '1. Pela 4 patatas medianas (3 minutos) y córtalas en trozos irregulares de unos 3 cm — los bordes irregulares se vuelven más crujientes al freírlos.\n2. Calienta abundante aceite de oliva en una sartén profunda a fuego medio-alto hasta unos 170°C (3 minutos).\n3. Fríe las patatas en tandas, sin amontonarlas, durante 8-10 minutos removiendo ocasionalmente hasta que estén doradas y crujientes por fuera y tiernas por dentro.\n4. Escúrrelas sobre papel absorbente (1 minuto) y sazónalas con sal gruesa inmediatamente mientras están calientes.\n5. Prepara la salsa brava (2 minutos): en una sartén pequeña, calienta 2 cucharadas del aceite de freír. Añade 2 dientes de ajo picados y una cucharada de harina. Remueve 1 minuto.\n6. Añade 200 ml de tomate triturado, una cucharadita de pimentón picante (o dulce más guindilla), un chorrito de vinagre y sal. Cocina 10 minutos a fuego bajo removiendo de vez en cuando.\n7. Tritura la salsa con una batidora (1 minuto) si quieres una textura más fina. Sirve las patatas con la salsa brava por encima o en un bol aparte para mojar.' },
  { id: 'r20', name: 'Yogur con granola', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Yogur natural', 'Granola', 'Miel', 'Plátano', 'Fresas', 'Frutos secos'], instructions: '1. Coloca 200 g de yogur natural, griego o normal, en un bol mediano (30 segundos).\n2. Lava las fresas y córtalas en cuartos (2 minutos). Pela el plátano y córtalo en rodajas de 1 cm.\n3. Añade un puñado generoso de granola crujiente sobre el yogur (30 segundos).\n4. Coloca las frutas frescas decorativamente encima de la granola (1 minuto).\n5. Añade un puñado de frutos secos variados (nueces, almendras, avellanas) troceados (30 segundos).\n6. Rocía con miel al gusto, una o dos cucharaditas (30 segundos). Sirve inmediatamente para que la granola se mantenga crujiente y no se ablande con el yogur.' },
  { id: 'r21', name: 'Paella valenciana', category: 'comida', time: '50 min', difficulty: 'Difícil', ingredients: ['Arroz', 'Pollo', 'Judías verdes', 'Garrofón', 'Tomate', 'Azafrán', 'Aceite de oliva', 'Sal', 'Agua'], instructions: '1. Calienta abundante aceite de oliva en una paellera grande a fuego medio-alto (2 minutos). Dora el pollo troceado por todos los lados durante 5-6 minutos hasta que esté bien dorado. Retíralo y resérvalo.\n2. En el mismo aceite, añade las judías verdes cortadas en trozos de 3 cm y saltéalas 3 minutos. Añade el tomate rallado y cocina 2 minutos más hasta que el tomate se concentre.\n3. Incorpora el garrofón (si es seco, previamente remojado) y una cucharadita de pimentón dulce (1 minuto). Remueve rápidamente para que no se queme el pimentón.\n4. Vierte el doble de agua que de arroz (aproximadamente 1 litro de agua por cada 500 g de arroz). Añade las hebras de azafrán y sal al gusto.\n5. Lleva el agua a ebullición y cocina a fuego vivo durante 10 minutos, probando el caldo y ajustando de sal — debe quedar sabroso.\n6. Añade el arroz distribuyéndolo uniformemente por toda la paellera en forma de cruz (2 minutos). No lo remuevas después de este punto bajo ninguna circunstancia.\n7. Coloca el pollo reservado sobre el arroz. Cocina a fuego medio-alto los primeros 10 minutos, luego baja a fuego medio.\n8. Los últimos 8 minutos no toques el arroz. Cuando ya casi no quede caldo visible, retira del fuego y cubre con un paño limpio.\n9. Deja reposar 5 minutos antes de servir. La paella debe tener una capa de arroz tostado en el fondo (socarrat) que es la parte más apreciada.' },
  { id: 'r22', name: 'Puré de patatas', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Patatas', 'Leche', 'Mantequilla', 'Sal', 'Nuez moscada', 'Pimienta'], instructions: '1. Pela 1 kg de patatas (5 minutos) y córtalas en trozos medianos, todos del mismo tamaño para que cuezan uniformemente.\n2. Colócalas en una olla grande y cúbrelas con agua fría con sal. Lleva a ebullición y cocina 20-25 minutos hasta que estén muy tiernas (se pinchan fácilmente con un cuchillo).\n3. Mientras tanto, calienta 200 ml de leche entera en un cazo a fuego bajo (3 minutos) sin que hierva y corta 50 g de mantequilla en cubos pequeños.\n4. Escurre bien las patatas (1 minuto) y pásalas por un pasapurés o un prensador de patatas — no uses batidora porque las vuelvegomosas y pegajosas.\n5. Añade la mantequilla y remueve hasta que se derrita completamente (1 minuto). Luego incorpora la leche caliente poco a poco mientras sigues removiendo con energía.\n6. Sazona con sal, pimienta blanca recién molida y una pizca de nuez moscada rallada (1 minuto).\n7. Bate con una espátula de madera (2 minutos) hasta conseguir una textura cremosa, sedosa y sin grumos. Sirve caliente.' },
  { id: 'r23', name: 'Tostadas de aguacate', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Pan', 'Aguacate', 'Tomate', 'Limón', 'Aceite de oliva', 'Sal', 'Pimienta', 'Semillas de sésamo'], instructions: '1. Tuesta 2 rebanadas de pan de molde o pan artesanal en una tostadora o sartén (2 minutos) hasta que estén doradas y crujientes.\n2. Corta un aguacate maduro por la mitad (1 minuto), retira el hueso golpeándolo con el cuchillo y extrae la pulpa con una cuchara. Colócala en un bol.\n3. Machaca el aguacate con un tenedor (1 minuto) hasta obtener la textura deseada (trozos gruesos o cremoso). Añade el zumo de medio limón, sal y pimienta y mezcla bien.\n4. Unta generosamente el aguacate machacado sobre cada tostada (1 minuto).\n5. Corta un tomate en rodajas finas (1 minuto) y colócalas sobre el aguacate.\n6. Rocía con un chorrito de aceite de oliva virgen extra, espolvorea semillas de sésamo tostadas y una pizca de sal en escamas (1 minuto).\n7. Opcional (1 minuto): añade huevo poché, queso feta desmenuzado o tiras de jamón serrano para hacerla más completa.' },
  { id: 'r24', name: 'Albóndigas en salsa', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Carne picada', 'Pan rallado', 'Huevos', 'Tomate', 'Cebolla', 'Ajo', 'Perejil', 'Harina', 'Aceite de oliva', 'Sal'], instructions: '1. En un bol grande, mezcla 500 g de carne picada de ternera y cerdo (mitad y mitad), media taza de pan rallado, 2 huevos batidos, 2 dientes de ajo picados, perejil fresco picado, sal y pimienta (5 minutos).\n2. Amasa bien con las manos (2 minutos) hasta que todos los ingredientes estén integrados. Forma albóndigas del tamaño de una nuez grande.\n3. Pasa las albóndigas ligeramente por harina (2 minutos), sacudiendo el exceso con las manos.\n4. Calienta aceite de oliva en una sartén profunda a fuego medio-alto. Fríe las albóndigas en tandas hasta que estén doradas por todos lados, unos 5 minutos por tanda. Retíralas y resérvalas.\n5. En la misma sartén, sofríe la cebolla picada fina y 3 dientes de ajo durante 5 minutos hasta que estén dorados y caramelizados.\n6. Añade 400 g de tomate triturado, una cucharadita de azúcar para reducir la acidez, sal, pimienta y una hoja de laurel (2 minutos).\n7. Cocina la salsa 10 minutos a fuego medio. Luego incorpora las albóndigas y cocina todo junto 20 minutos más a fuego bajo, removiendo suavemente de vez en cuando.\n8. Sirve las albóndigas bañadas en salsa (1 minuto), acompañadas de arroz blanco o puré de patatas.' },
  { id: 'r25', name: 'Batido de proteínas', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Leche', 'Plátano', 'Avena', 'Mantequilla de cacahuete', 'Miel', 'Cacao'], instructions: '1. Pela un plátano maduro (30 segundos) — cuanto más maduro, más dulzor natural aportará al batido.\n2. Añade a la licuadora: 250 ml de leche (entera, semidesnatada o vegetal), el plátano troceado, 3 cucharadas de avena en copos, una cucharada de mantequilla de cacahuete cremosa, una cucharadita de miel y una cucharada de cacao puro en polvo (2 minutos).\n3. Licúa a máxima potencia durante 30 segundos hasta que todos los ingredientes estén completamente integrados y la textura sea cremosa y homogénea.\n4. Prueba (30 segundos) y ajusta el dulzor añadiendo más miel si lo deseas. Si está demasiado espeso, añade un poco más de leche y licúa de nuevo 10 segundos.\n5. Sirve inmediatamente en un vaso grande (30 segundos). Puedes decorar con un poco de cacao en polvo espolvoreado por encima o añadir hielo para una versión más refrescante.' },
  { id: 'r26', name: 'Pollo a la plancha', category: 'comida', time: '15 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Limón'], instructions: '1. Si las pechugas son muy gruesas, córtalas horizontalmente (2 minutos) para obtener filetes más finos de 1 cm que se cocinen uniformemente.\n2. Sazona ambos lados del pollo con sal y pimienta negra recién molida (1 minuto). Puedes añadir ajo en polvo o hierbas provenzales para dar más sabor.\n3. Calienta una plancha o sartén antiadherente a fuego fuerte con un chorrito de aceite de oliva (2 minutos).\n4. Cuando el aceite esté caliente pero sin humear, coloca el pollo. Cocina 5 minutos sin moverlo para que se forme una costra dorada en la superficie.\n5. Dale la vuelta y cocina otros 4-5 minutos. El pollo debe estar dorado por fuera y jugoso por dentro. Si tienes un termómetro, la temperatura interna debe alcanzar 75°C.\n6. Exprime medio limón sobre el pollo recién hecho (1 minuto) y deja reposar un par de minutos antes de servir para que los jugos se asienten.\n7. Sirve caliente (1 minuto) acompañado de una ensalada verde, verduras salteadas o arroz blanco.' },
  { id: 'r27', name: 'Ensalada mixta', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Lechuga', 'Tomate', 'Cebolla', 'Atún en lata', 'Aceite de oliva', 'Vinagre', 'Sal'], instructions: '1. Lava bien las hojas de lechuga (2 minutos) — puede ser iceberg, romana o mezcla de lechugas. Sécalas con un centrifugador de ensalada o con papel de cocina.\n2. Corta la lechuga en trozos grandes y colócala en una ensaladera amplia (1 minuto).\n3. Lava los tomates y córtalos en rodajas o gajos (1 minuto). Pela la cebolla y córtala en aros finos.\n4. Escurre el atún en lata y desmenúzalo ligeramente con un tenedor (1 minuto).\n5. Coloca los tomates, la cebolla y el atún sobre la lechuga (2 minutos). Añade si tienes: aceitunas, maíz dulce, huevo duro picado o tiras de pimiento.\n6. Prepara la vinagreta en un bol pequeño (1 minuto): 3 partes de aceite de oliva virgen extra por 1 parte de vinagre, sal y una pizca de orégano. Bate con un tenedor hasta emulsionar.\n7. Aliña la ensalada justo antes de servir (1 minuto) y mezcla bien para que todos los ingredientes se impregnen del aliño.' },
  { id: 'r28', name: 'Arroz blanco', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Arroz', 'Agua', 'Aceite de oliva', 'Sal', 'Ajo'], instructions: '1. Calienta 2 cucharadas de aceite de oliva en una cacerola a fuego medio (1 minuto). Añade 2 dientes de ajo enteros sin pelar y ligeramente aplastados y dóralos 1 minuto para aromatizar el aceite.\n2. Añade 1 taza de arroz blanco de grano largo o redondo y remueve 1 minuto para que el arroz se impregne del aceite y se vuelva traslúcido.\n3. Vierte 2 tazas de agua caliente (el doble que de arroz) y añade sal al gusto (1 minuto).\n4. Lleva a ebullición a fuego alto, luego baja el fuego al mínimo, tapa la cacerola y cocina 18 minutos exactos sin destapar ni remover.\n5. Apaga el fuego y deja reposar tapado 5 minutos más para que el arroz termine de absorber el vapor y los granos se suelten.\n6. Destapa, retira los ajos enteros, remueve suavemente con un tenedor (1 minuto) para soltar los granos y sirve caliente.' },
  { id: 'r29', name: 'Huevos revueltos', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Leche', 'Mantequilla', 'Sal', 'Pimienta'], instructions: '1. Casca 4 huevos en un bol (1 minuto). Añade 2 cucharadas de leche entera (opcional, pero aporta cremosidad), sal y pimienta negra recién molida.\n2. Bate los huevos con un tenedor o varillas durante 30 segundos hasta que las claras y las yemas estén completamente integradas y aparezca algo de espuma en la superficie.\n3. Derrite una cucharada de mantequilla en una sartén antiadherente a fuego medio-bajo (1 minuto).\n4. Vierte los huevos batidos y espera 30 segundos hasta que empiecen a cuajarse en los bordes.\n5. Con una espátula de silicona, empuja suavemente los bordes hacia el centro formando pliegues (2 minutos). Repite este movimiento cada 15-20 segundos.\n6. Cuando los huevos estén cremosos y aún ligeramente húmedos (1 minuto), retíralos del fuego — el calor residual terminará de cocinarlos.\n7. Sirve inmediatamente sobre una rebanada de pan tostado o acompañados de aguacate (1 minuto). Los huevos revueltos siguen cociéndose fuera del fuego, así que retíralos antes de que parezcan completamente secos.' },
  { id: 'r30', name: 'Sopa de fideos', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Caldo de pollo', 'Fideos', 'Pollo', 'Zanahoria', 'Sal'], instructions: '1. Si usas caldo de pollo casero, cuélalo para retirar impurezas (2 minutos). Si es de brick, puedes diluirlo con un poco de agua si resulta muy intenso.\n2. Pela la zanahoria (1 minuto) y córtala en rodajas finas o en dados pequeños. También puedes usar cortadores en forma de estrella para un toque divertido.\n3. Desmenuza el pollo cocido en hebras finas con dos tenedores (3 minutos). Si no tienes pollo cocido, puedes cocer una pechuga en el caldo 15 minutos y luego desmenuzarla.\n4. Lleva el caldo a ebullición en una olla mediana (3 minutos). Añade las zanahorias y cocina 5 minutos.\n5. Añade los fideos (cabello de ángel, fideos finos o pasta pequeña) y el pollo desmenuzado. Cocina según el tiempo del paquete, generalmente 6-8 minutos.\n6. Prueba (1 minuto) y rectifica de sal si es necesario. Si el caldo ha reducido mucho, añade un poco de agua caliente.\n7. Sirve bien caliente en cuencos hondos (1 minuto). Puedes añadir un chorrito de limón y perejil fresco picado por encima.' },
  { id: 'r31', name: 'Pasta con atún', category: 'cena', time: '15 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Atún en lata', 'Tomate triturado', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Sal'], instructions: '1. Pon una olla grande con agua a hervir (5 minutos hasta ebullición). Cuando hierva, añade sal y 300 g de pasta (espaguetis, penne o la que prefieras). Cocínala al dente según el tiempo del paquete.\n2. Mientras la pasta se cuece, prepara la salsa: pica finamente media cebolla y 2 dientes de ajo (2 minutos).\n3. Calienta 3 cucharadas de aceite de oliva en una sartén a fuego medio. Sofríe la cebolla 4 minutos hasta que esté dorada. Añade el ajo y cocina 1 minuto más.\n4. Vierte el tomate triturado (400 g), sal, pimienta y una pizca de orégano. Cocina 5 minutos a fuego medio, removiendo de vez en cuando.\n5. Escurre el atún (1 minuto) y desmenúzalo. Incorpóralo a la salsa y mezcla bien. Cocina 2 minutos más para integrar los sabores.\n6. Escurre la pasta (1 minuto) reservando una taza del agua de cocción. Añade la pasta a la sartén con la salsa y mezcla bien.\n7. Si la pasta está demasiado seca (1 minuto), añade un poco del agua reservada. Sirve caliente con queso rallado opcional.' },
  { id: 'r32', name: 'Pechuga empanada', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Pan rallado', 'Huevos', 'Harina', 'Aceite de oliva', 'Sal'], instructions: '1. Coloca las pechugas de pollo entre dos hojas de film transparente y aplánalas con un rodillo o el dorso de una sartén (3 minutos) hasta que tengan un grosor uniforme de 1 cm.\n2. Sazona ambos lados con sal y pimienta (1 minuto). Opcional: añade ajo en polvo, pimentón o hierbas al pan rallado para dar más sabor.\n3. Prepara tres platos hondos (2 minutos): uno con harina de trigo, otro con 2 huevos batidos con un poco de sal, y el tercero con pan rallado abundante.\n4. Pasa cada filete primero por harina sacudiendo el exceso, luego por huevo batido y finalmente por pan rallado presionando ligeramente (3 minutos).\n5. Calienta una sartén con aceite de oliva abundante (unos 2 cm de altura) a fuego medio-alto (2 minutos).\n6. Fríe los filetes empanados 3 minutos por cada lado hasta que estén dorados y crujientes. No los amontones en la sartén; hazlo en tandas si es necesario.\n7. Escúrrelos sobre papel absorbente (1 minuto) para eliminar el exceso de aceite. Sirve caliente con rodajas de limón, ensalada o patatas fritas.' },
  { id: 'r33', name: 'Ensalada de tomate', category: 'almuerzo', time: '5 min', difficulty: 'Fácil', ingredients: ['Tomate', 'Cebolla', 'Aceite de oliva', 'Vinagre', 'Sal', 'Orégano'], instructions: '1. Lava los tomates y sécalos (1 minuto). Córtalos en rodajas de unos 5 mm de grosor, intentando que todas sean del mismo tamaño para una presentación uniforme.\n2. Pela media cebolla, mejor si es morada por su sabor más suave (1 minuto), y córtala en aros muy finos, casi transparentes.\n3. Coloca las rodajas de tomate en un plato llano (1 minuto), superponiéndolas ligeramente en círculo o en filas.\n4. Distribuye los aros de cebolla sobre los tomates de manera uniforme (1 minuto).\n5. En un bol pequeño, mezcla 3 cucharadas de aceite de oliva virgen extra, 1 cucharada de vinagre de Jerez o modena, sal en escamas y una cucharadita de orégano seco (1 minuto).\n6. Vierte el aliño por encima justo antes de servir (1 minuto). Deja reposar 5 minutos para que los tomates absorban los sabores.\n7. Opcional (1 minuto): añade aceitunas negras, alcaparras, huevo duro picado o atún en lata para hacerla más completa.' },
  { id: 'r34', name: 'Patatas al horno', category: 'comida', time: '40 min', difficulty: 'Fácil', ingredients: ['Patatas', 'Aceite de oliva', 'Sal', 'Pimienta', 'Romero'], instructions: '1. Precalienta el horno a 200°C con calor arriba y abajo (10-15 minutos para precalentar).\n2. Lava bien las patatas sin pelar (3 minutos) — la piel queda crujiente y aporta textura. Córtalas en cuartos o en gajos de tamaño uniforme.\n3. Coloca las patatas en una olla con agua fría y llévalas a ebullición (5 minutos). Escáldalas 5 minutos — esto ayuda a que queden esponjosas por dentro y crujientes por fuera.\n4. Escúrrelas y agítalas en el colador (1 minuto) para que las superficies se raspen ligeramente, lo que mejora el crujiente.\n5. En un bol grande, mezcla las patatas con 4 cucharadas de aceite de oliva, sal generosa, pimienta negra recién molida y 2 ramitas de romero fresco o seco desmenuzado (2 minutos).\n6. Extiende las patatas en una sola capa sobre una bandeja de horno forrada con papel vegetal, dejando espacio entre ellas (1 minuto).\n7. Hornea 35-40 minutos, dando la vuelta a las patatas a mitad de cocción (minuto 20), hasta que estén doradas y crujientes por fuera y tiernas por dentro.\n8. Sirve caliente (1 minuto) con un poco más de sal en escamas y romero fresco.' },
  { id: 'r35', name: 'Crema de zanahoria', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Zanahoria', 'Cebolla', 'Patata', 'Caldo de verduras', 'Nata', 'Aceite de oliva', 'Sal'], instructions: '1. Pela 500 g de zanahorias y córtalas en rodajas (4 minutos). Pela una cebolla y córtala en juliana. Pela una patata mediana y córtala en cubos — la patata ayuda a espesar la crema.\n2. En una olla grande, calienta 3 cucharadas de aceite de oliva a fuego medio. Sofríe la cebolla 5 minutos hasta que esté tierna y ligeramente dorada.\n3. Añade las zanahorias y la patata (1 minuto). Remueve 2 minutos para que se impregnen del aceite y los aromas.\n4. Cubre con caldo de verduras caliente (unos 600 ml) hasta sobrepasar las verduras por 2 cm. Añade sal y pimienta (1 minuto).\n5. Lleva a ebullición, baja el fuego a medio, tapa y cocina 20 minutos hasta que las zanahorias estén muy tiernas.\n6. Tritura la sopa con una batidora de mano (2 minutos) hasta obtener una textura fina y sedosa. Si está demasiado espesa, añade más caldo.\n7. Añade 100 ml de nata líquida, mezcla bien y calienta 2 minutos más sin que hierva. Rectifica de sal (1 minuto).\n8. Sirve caliente (1 minuto) con un chorrito de aceite de oliva, semillas de sésamo o sésamo tostado por encima.' },
  { id: 'r36', name: 'Tortilla francesa', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Sal', 'Aceite de oliva'], instructions: '1. Casca 2-3 huevos en un bol (30 segundos). Añade una pizca de sal y, si te gusta, una cucharada de agua o leche para que quede más esponjosa.\n2. Bate los huevos con un tenedor o varillas manuales durante 15-20 segundos, hasta que las claras y las yemas estén completamente integradas y aparezca algo de espuma.\n3. Calienta una sartén antiadherente pequeña con una cucharadita de aceite de oliva a fuego medio-alto (1 minuto).\n4. Cuando el aceite esté caliente, vierte los huevos batidos y extiéndelos uniformemente moviendo la sartén en círculos (30 segundos).\n5. Deja cuajar 1-2 minutos hasta que los bordes se despeguen solos y la base esté dorada. La superficie debe estar todavía ligeramente húmeda.\n6. Dobla la tortilla por la mitad con una espátula (30 segundos) y desliza a un plato. El calor residual terminará de cocinarla.\n7. Sirve inmediatamente (30 segundos). Puedes acompañarla de lechuga, tomate, jamón o espinacas salteadas.' },
  { id: 'r37', name: 'Garbanzos con espinacas', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Garbanzos', 'Espinacas', 'Ajo', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Si usas garbanzos de bote, escúrrelos y lávalos bajo agua fría (1 minuto). Si son secos, deberás ponerlos en remojo la noche anterior y cocerlos 1 hora antes.\n2. Lava bien las espinacas frescas (2 minutos). Si son congeladas, descongélalas y escúrrelas bien.\n3. Pela 4 dientes de ajo (1 minuto) y córtalos en láminas finas.\n4. Calienta 4 cucharadas de aceite de oliva en una sartén grande o cazuela a fuego medio (1 minuto).\n5. Sofríe el ajo laminado hasta que esté dorado (unos 2 minutos). Retira del fuego y añade una cucharadita de pimentón dulce, removiendo rápidamente para que no se queme.\n6. Vuelve al fuego (1 minuto), incorpora los garbanzos y las espinacas. Remueve bien para que se mezclen todos los sabores.\n7. Cocina 5-7 minutos a fuego medio hasta que las espinacas hayan reducido totalmente su volumen y estén tiernas.\n8. Sazona con sal al gusto y un chorrito de vinagre opcional (1 minuto). Sirve caliente como plato principal o acompañamiento.' },
  { id: 'r38', name: 'Pollo con arroz', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Arroz', 'Cebolla', 'Ajo', 'Pimiento', 'Aceite de oliva', 'Sal', 'Caldo de pollo'], instructions: '1. Corta las pechugas de pollo en dados de unos 3 cm (3 minutos). Sazónalos con sal y pimienta.\n2. Calienta 3 cucharadas de aceite de oliva en una olla a fuego medio-alto (1 minuto). Dora el pollo por todos lados durante 4-5 minutos. Retíralo y resérvalo.\n3. En la misma olla, añade la cebolla picada fina, 3 dientes de ajo picados y el pimiento rojo o verde en tiras. Sofríe 5 minutos hasta que estén blandos y ligeramente dorados.\n4. Añade 1 taza y media de arroz de grano largo y remueve 1 minuto para que se impregne de los sabores.\n5. Vierte 3 tazas de caldo de pollo caliente (doble que de arroz) y vuelve a incorporar el pollo. Sazona con sal, pimienta y una pizca de cúrcuma para dar color (1 minuto).\n6. Lleva a ebullición, baja el fuego al mínimo, tapa y cocina 18-20 minutos sin destapar.\n7. Apaga el fuego, deja reposar tapado 5 minutos. Destapa, remueve suavemente con un tenedor (1 minuto) y sirve caliente.' },
  { id: 'r39', name: 'Tostada con tomate', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Pan', 'Tomate', 'Aceite de oliva', 'Sal', 'Jamón'], instructions: '1. Corta 2 rebanadas de pan del día anterior (1 minuto), mejor si es un pan artesanal o de barra más consistente. Tuesta las rebanadas en una tostadora, sartén o grill hasta que estén doradas y crujientes (2 minutos).\n2. Lava un tomate maduro grande (30 segundos), córtalo por la mitad transversalmente.\n3. Restriega media rodaja de tomate sobre cada tostada presionando ligeramente (1 minuto), para que la pulpa y el jugo se impregnen en el pan. Desecha la piel restante.\n4. Rocía cada tostada con un chorro generoso de aceite de oliva virgen extra (30 segundos).\n5. Espolvorea sal en escamas o sal fina al gusto (30 segundos).\n6. Coloca una loncha de jamón serrano o cocido sobre cada tostada o ambos (1 minuto).\n7. Opcional (30 segundos): añade una pizca de pimienta negra recién molida y un poco de orégano. Sirve inmediatamente.' },
  { id: 'r40', name: 'Merluza a la plancha', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Merluza', 'Aceite de oliva', 'Sal', 'Limón', 'Perejil'], instructions: '1. Si la merluza está congelada, descongélala completamente en la nevera durante la noche o sumerge los lomos en un bol con agua fría 30 minutos.\n2. Sécala bien con papel de cocina (1 minuto) — el exceso de agua evita que se dore correctamente y salpica al freír.\n3. Sazona ambos lados de los lomos de merluza con sal fina (1 minuto).\n4. Calienta una sartén antiadherente a fuego fuerte con 2 cucharadas de aceite de oliva (2 minutos).\n5. Coloca el pescado con la piel hacia abajo si tiene. Cocina 3 minutos sin moverlo para que se forme una costra dorada y crujiente.\n6. Dale la vuelta con cuidado con una espátula ancha (1 minuto) y cocina otros 2-3 minutos. El pescado debe estar opaco y desmenuzarse fácilmente.\n7. Exprime medio limón sobre el pescado recién hecho y espolvorea perejil fresco picado (1 minuto).\n8. Sirve inmediatamente (1 minuto) acompañado de patatas cocidas, ensalada o verduras salteadas.' },
  { id: 'r41', name: 'Ensalada de pasta', category: 'almuerzo', time: '20 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Tomate', 'Pepino', 'Atún en lata', 'Aceitunas', 'Aceite de oliva', 'Sal'], instructions: '1. Pon una olla grande con agua a hervir (5 minutos hasta ebullición). Añade sal y 250 g de pasta corta (coditos, espirales, mariposas). Cocínala al dente, unos 2 minutos menos de lo indicado para que no se deshaga al mezclarla.\n2. Escurre la pasta y pásala bajo agua fría para cortar la cocción (1 minuto). Escúrrela bien y rocíala con un chorrito de aceite para que no se pegue. Deja enfriar mientras preparas el resto.\n3. Lava el tomate y el pepino (2 minutos). Corta el tomate en dados pequeños y el pepino en medias lunas finas.\n4. Escurre el atún y desmenúzalo (1 minuto). Corta las aceitunas en rodajas sin hueso.\n5. En un bol grande, mezcla la pasta fría con el tomate, pepino, atún y aceitunas (2 minutos).\n6. Añade si tienes (1 minuto): maíz dulce, pimiento rojo en dados, cebolla morada picada o queso en cubos.\n7. Aliña con aceite de oliva virgen extra, vinagre o zumo de limón, sal y orégano (1 minuto). Mezcla bien.\n8. Sirve fría o a temperatura ambiente (1 minuto). Esta ensalada aguanta bien en la nevera y sabe mejor al día siguiente.' },
  { id: 'r42', name: 'Lentejas rápidas', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Lentejas', 'Chorizo', 'Patata', 'Cebolla', 'Ajo', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Si usas lentejas de bote cocidas, escúrrelas y lávalas bajo el agua del grifo (1 minuto) para eliminar el líquido de conservación.\n2. Pela la patata y córtala en dados pequeños de 1 cm (2 minutos) para que se cocine rápido. Pica la cebolla y los ajos finos.\n3. Corta el chorizo en rodajas o medialunas (2 minutos). Si es muy graso, puedes pasarlo por la sartén primero para eliminar el exceso de grasa.\n4. Calienta 3 cucharadas de aceite de oliva en una cazuela a fuego medio. Sofríe la cebolla y el ajo 4 minutos hasta que estén transparentes.\n5. Añade una cucharadita de pimentón dulce (1 minuto), remueve rápidamente y agrega inmediatamente las lentejas para que no se queme el pimentón.\n6. Incorpora las patatas y el chorizo. Cubre con agua o caldo (unos 500 ml) y sazona con sal con cuidado — el chorizo ya aporta sal (2 minutos).\n7. Lleva a ebullición, baja el fuego y cocina 15 minutos hasta que las patatas estén tiernas.\n8. Rectifica de sal (1 minuto), deja reposar 5 minutos y sirve caliente. Ideal con un huevo escalfado o arroz blanco.' },
  { id: 'r43', name: 'Quesadillas', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Tortillas de trigo', 'Queso cheddar', 'Pollo', 'Pimiento', 'Cebolla'], instructions: '1. Cocina el pollo a la plancha con sal y pimienta (5 minutos) si no tienes pollo ya cocido. Déjalo reposar 2 minutos y córtalo en tiras finas.\n2. Corta el pimiento en tiras finas y la cebolla en juliana (2 minutos).\n3. Saltea las verduras en una sartén con un poco de aceite durante 3-4 minutos hasta que estén tiernas. Resérvalas.\n4. Calienta una sartén antiadherente grande a fuego medio (1 minuto). Coloca una tortilla de trigo en la sartén.\n5. Cubre la mitad de la tortilla con una capa generosa de queso cheddar rallado (1 minuto).\n6. Distribuye el pollo en tiras y las verduras salteadas sobre el queso (1 minuto).\n7. Dobla la tortilla por la mitad presionando ligeramente con una espátula (1 minuto). Cocina 1-2 minutos por cada lado hasta que el queso esté completamente derretido y la tortilla esté dorada y crujiente.\n8. Retira de la sartén (1 minuto), corta en triángulos y sirve caliente con guacamole, crema agria o salsa picante.' },
  { id: 'r44', name: 'Batido de frutas', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Plátano', 'Fresas', 'Leche', 'Miel', 'Yogur natural'], instructions: '1. Pela un plátano maduro (30 segundos) y córtalo en rodajas. Lava 6-8 fresas y retírales el tallo verde (1 minuto).\n2. Coloca la fruta en el vaso de la licuadora (30 segundos).\n3. Añade 200 ml de leche fría (entera, semidesnatada o vegetal) y 100 g de yogur natural (30 segundos). El yogur aporta cremosidad y un toque de acidez que equilibra el dulzor.\n4. Agrega una o dos cucharadas de miel al gusto (30 segundos) — la cantidad depende de lo maduras que estén las frutas.\n5. Licúa a máxima potencia durante 30-40 segundos hasta obtener una textura homogénea y cremosa.\n6. Prueba (30 segundos) y ajusta: si está muy espeso, añade más leche; si poco dulce, más miel.\n7. Sirve inmediatamente en un vaso grande (30 segundos). Puedes decorar con media fresa en el borde del vaso. Los batidos se oxidan rápido, así que consúmelos recién hechos.' },
  { id: 'r45', name: 'Verduras salteadas', category: 'comida', time: '15 min', difficulty: 'Fácil', ingredients: ['Calabacín', 'Pimiento', 'Cebolla', 'Zanahoria', 'Ajo', 'Aceite de oliva', 'Sal', 'Soja'], instructions: '1. Lava todas las verduras (2 minutos). Corta el calabacín en medias lunas, el pimiento en tiras, la cebolla en juliana, y pela la zanahoria para cortarla en bastones finos.\n2. Pela y lamina 2 dientes de ajo (1 minuto).\n3. Calienta un wok o sartén grande a fuego fuerte con 3 cucharadas de aceite de oliva o de sésamo para un toque asiático (1 minuto).\n4. Añade primero la zanahoria (es la más dura) y saltéala 3 minutos removiendo constantemente.\n5. Incorpora el pimiento y la cebolla (1 minuto), saltea 2 minutos más a fuego fuerte.\n6. Añade el calabacín y el ajo (1 minuto). Saltea 3 minutos hasta que todas las verduras estén tiernas pero aún crujientes (al dente).\n7. Sazona con sal y un chorrito de salsa de soja al final (1 minuto). Remueve bien y retira del fuego.\n8. Sirve caliente (1 minuto) como acompañamiento de carnes, pescados o tofu, o como plato principal con arroz blanco o quinoa.' },
  { id: 'r46', name: 'Croquetas de patata', category: 'cena', time: '30 min', difficulty: 'Media', ingredients: ['Patatas', 'Huevos', 'Pan rallado', 'Harina', 'Queso', 'Aceite de oliva', 'Sal', 'Nuez moscada'], instructions: '1. Pela 500 g de patatas (3 minutos), córtalas en trozos y hiérvelas en agua con sal 20 minutos hasta que estén muy tiernas.\n2. Escurre bien (1 minuto) y haz un puré con un pasapurés o tenedor. Deja enfriar ligeramente.\n3. Mezcla el puré con 100 g de queso rallado (cheddar, emmental o el que tengas), un huevo batido, sal, pimienta y una pizca de nuez moscada rallada (4 minutos). Remueve hasta obtener una masa homogénea.\n4. Deja enfriar la masa en la nevera 15 minutos para que sea más fácil de manejar y no se pegue a las manos.\n5. Con las manos ligeramente humedecidas, forma croquetas alargadas o bolitas del tamaño de una nuez (5 minutos).\n6. Prepara tres platos (2 minutos): uno con harina, otro con 2 huevos batidos y otro con pan rallado abundante. Reboza cada croqueta pasándola por harina, luego huevo y finalmente pan rallado.\n7. Calienta aceite abundante en una sartén a fuego medio (2 minutos). Fríe las croquetas en tandas, 2-3 minutos por cada lado, hasta que estén doradas y crujientes.\n8. Escurre sobre papel absorbente (1 minuto) y sirve caliente con mayonesa, alioli o salsa de tomate.' },
  { id: 'r47', name: 'Sándwich mixto', category: 'cena', time: '5 min', difficulty: 'Fácil', ingredients: ['Pan', 'Jamón', 'Queso', 'Mantequilla'], instructions: '1. Toma 2 rebanadas de pan de molde (1 minuto) — mejor si es un pan de calidad, más consistente para que aguante el calor.\n2. Unta mantequilla a temperatura ambiente en una cara de cada rebanada de pan (1 minuto) — esto ayuda a que se dore uniformemente al tostarse.\n3. Coloca una o dos lonchas de jamón cocido o york sobre la cara sin mantequilla de una rebanada (30 segundos).\n4. Añade una o dos lonchas de queso (cheddar, emmental, gouda o el que prefieras) sobre el jamón (30 segundos).\n5. Cubre con la otra rebanada de pan, con el lado untado de mantequilla hacia fuera (30 segundos).\n6. Calienta una sartén antiadherente o sandwichera a fuego medio-alto (1 minuto).\n7. Tuesta el sándwich 2-3 minutos por cada lado, presionando ligeramente con una espátula, hasta que el pan esté dorado y crujiente y el queso se haya derretido por completo.\n8. Corta en diagonal (30 segundos), espera un minuto a que se enfríe ligeramente y sirve. Ideal con sopa de tomate.' },
  { id: 'r48', name: 'Guiso de patatas con carne', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Patatas', 'Carne picada', 'Cebolla', 'Ajo', 'Tomate triturado', 'Pimiento', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Pela 4 patatas grandes (4 minutos) y córtalas en dados de unos 3 cm. Pela y pica la cebolla en brunoise, los ajos en láminas y el pimiento en tiras.\n2. Calienta 4 cucharadas de aceite de oliva en una cazuela grande a fuego medio. Sofríe la cebolla y el ajo 5 minutos hasta que estén transparentes.\n3. Añade 400 g de carne picada de ternera y salpimienta al gusto. Cocina removiendo para romper la carne, hasta que esté dorada (unos 6-7 minutos).\n4. Incorpora el pimiento y cocina 2 minutos más. Añade 400 ml de tomate triturado, una hoja de laurel y una cucharadita de pimentón dulce (2 minutos).\n5. Cocina la salsa 5 minutos a fuego medio para que concentre sabores. Luego añade las patatas y cubre con agua caliente (unos 500 ml).\n6. Lleva a ebullición, baja el fuego a medio-bajo, tapa parcialmente y cocina 30 minutos removiendo de vez en cuando para que no se pegue.\n7. Las patatas deben estar tiernas y el caldo ligeramente espeso (1 minuto). Si queda muy líquido, destapa los últimos 5 minutos para que reduzca.\n8. Rectifica de sal y pimienta (1 minuto), retira el laurel y sirve caliente. Este plato mejora si se deja reposar unos minutos antes de servir.' },
  { id: 'r49', name: 'Tortilla de jamón y queso', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Jamón', 'Queso', 'Sal', 'Aceite de oliva'], instructions: '1. Casca 3 huevos en un bol (30 segundos), añade una pizca de sal y bate hasta que las claras y las yemas estén bien integradas.\n2. Corta 2 lonchas de jamón cocido o serrano en tiras finas (1 minuto). Corta 2 lonchas de queso (cheddar, emmental o el que más te guste) en trozos pequeños.\n3. Incorpora el jamón y el queso a los huevos batidos y mezcla bien (1 minuto).\n4. Calienta una sartén antiadherente pequeña con una cucharada de aceite de oliva a fuego medio (1 minuto).\n5. Vierte la mezcla y extiéndela uniformemente por la sartén (30 segundos).\n6. Cocina 2-3 minutos hasta que la base esté dorada y los bordes comiencen a despegarse de la sartén.\n7. Con una espátula, dobla la tortilla por la mitad (1 minuto). Cocina 1 minuto más por cada lado para que el queso se derrita completamente.\n8. Desliza a un plato (30 segundos) y sirve caliente, acompañada de una ensalada verde o tomate aliñado.' },
  { id: 'r50', name: 'Ensalada de garbanzos', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Garbanzos', 'Tomate', 'Pepino', 'Cebolla', 'Pimiento', 'Aceite de oliva', 'Vinagre', 'Sal'], instructions: '1. Escurre un bote de garbanzos cocidos y lávalos bajo agua fría (1 minuto) para eliminar el líquido de conservación y el exceso de sodio.\n2. Coloca los garbanzos en un bol grande (30 segundos). Si quieres, puedes secarlos ligeramente con un paño limpio.\n3. Lava el tomate, el pepino y el pimiento (2 minutos). Corta el tomate en dados medianos, el pepino en medias lunas o dados, y el pimiento en cuadrados pequeños.\n4. Pela media cebolla morada (1 minuto) — por su sabor más suave — y córtala en juliana muy fina.\n5. Añade todas las verduras al bol con los garbanzos (1 minuto).\n6. Agrega si tienes (1 minuto): aceitunas negras, perejil fresco picado, aguacate en dados o atún desmenuzado para hacerla más completa.\n7. Prepara la vinagreta (1 minuto): mezcla 3 cucharadas de aceite de oliva virgen extra, 1 cucharada de vinagre de vino o limón, sal, pimienta y una pizca de comino molido.\n8. Vierte el aliño sobre la ensalada (1 minuto), mezcla bien y deja reposar 5 minutos antes de servir para que los sabores se integren. Esta ensalada aguanta bien en la nevera 1-2 días.' },
];

const ingredientCategories = {
  'Proteínas': [
    'Pollo', 'Ternera', 'Cerdo', 'Carne picada', 'Pavo', 'Jamón', 'Salchichas',
    'Salmón', 'Pescado blanco', 'Merluza', 'Atún en lata', 'Sardinas', 'Gambas',
    'Huevos',
  ],
  'Frutas y Verduras': [
    'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Zanahoria', 'Calabacín', 'Berenjena', 'Calabaza',
    'Lechuga', 'Espinacas', 'Col', 'Judías verdes', 'Champiñones', 'Pepino', 'Brócoli',
    'Patatas', 'Aguacate',
    'Plátano', 'Manzana', 'Fresas', 'Limón', 'Naranja', 'Uvas', 'Pera', 'Melón', 'Sandía', 'Kiwi',
  ],
  'Lácteos': [
    'Leche', 'Yogur natural', 'Queso', 'Queso cheddar', 'Queso parmesano', 'Queso mozzarella',
    'Nata', 'Mantequilla', 'Crema agria', 'Requesón',
  ],
  'Hidratos': [
    'Arroz', 'Pasta', 'Macarrones', 'Espaguetis', 'Pan', 'Pan de hamburguesa', 'Pan rallado',
    'Tortillas de trigo', 'Tortillas de maíz', 'Harina', 'Avena', 'Granola',
    'Lentejas', 'Garbanzos', 'Alubias', 'Garrofón', 'Quinoa', 'Cuscús',
    'Maíz dulce',
  ],
  'Conservas': [
    'Tomate triturado', 'Tomate frito', 'Caldo de pollo', 'Caldo de verduras',
    'Aceitunas', 'Pimientos asados', 'Alcachofas en conserva',
  ],
  'Condimentos': [
    'Aceite de oliva', 'Sal', 'Pimienta', 'Vinagre', 'Mostaza', 'Ketchup', 'Mayonesa', 'Miel',
    'Perejil', 'Albahaca', 'Cilantro', 'Eneldo', 'Azafrán', 'Comino', 'Pimentón', 'Pimentón picante',
    'Orégano', 'Nuez moscada', 'Jengibre', 'Canela', 'Laurel', 'Tomillo', 'Romero', 'Curry',
    'Semillas de sésamo', 'Frutos secos', 'Mantequilla de cacahuete', 'Cacao',
  ],
};

const PANTRY_INGREDIENTS = Object.values(ingredientCategories).flat();

const categories = ['Todas', 'desayuno', 'almuerzo', 'comida', 'cena'];
const difficulties = ['Todas', 'Fácil', 'Media', 'Difícil'];

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const matchIngredients = (haveList, recipeIngredients) => {
  const lowerHave = haveList.map(n => normalize(n));
  const matched = recipeIngredients.filter(ing => {
    const lowerIng = normalize(ing);
    return lowerHave.some(h => h.includes(lowerIng) || lowerIng.includes(h));
  });
  return matched;
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [pantryItems, setPantryItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [searchIngredient, setSearchIngredient] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipePhoto, setRecipePhoto] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterDifficulty, setFilterDifficulty] = useState('Todas');
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [toast, setToast] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    loadPantry();
    setRecipes(RECIPE_DB);
  }, []);

  const loadPantry = async () => {
    try {
      const items = await api.getPantry();
      if (items?.length) {
        const names = items.map(i => i.name).filter(Boolean);
        setPantryItems(names);
        setSelectedIngredients(names);
      }
    } catch (e) { console.error(e); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const addCustomIngredient = () => {
    const trimmed = customIngredient.trim();
    if (trimmed && !selectedIngredients.includes(trimmed)) {
      setSelectedIngredients(prev => [...prev, trimmed]);
      setCustomIngredient('');
    }
  };

  const removeIngredient = (ing) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ing));
  };

  const searchRecipes = () => {
    if (selectedIngredients.length === 0) {
      showToast('Selecciona al menos un ingrediente');
      return;
    }

    let filtered = [...recipes];

    if (filterCategory !== 'Todas') {
      filtered = filtered.filter(r => r.category === filterCategory);
    }
    if (filterDifficulty !== 'Todas') {
      filtered = filtered.filter(r => r.difficulty === filterDifficulty);
    }

    const scored = filtered.map(recipe => {
      const matched = matchIngredients(selectedIngredients, recipe.ingredients);
      const matchPercent = Math.round((matched.length / recipe.ingredients.length) * 100);
      return { ...recipe, matched, missing: recipe.ingredients.filter(i => !matched.includes(i)), matchPercent };
    }).filter(r => r.matchPercent > 0);

    scored.sort((a, b) => {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
      return b.matched.length - a.matched.length;
    });

    setResults(scored);
    setSearched(true);
    setShowIngredientPicker(false);
  };

  const handleRecipePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setRecipePhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    setResults([]);
    setSearched(false);
    setFilterCategory('Todas');
    setFilterDifficulty('Todas');
  };

  const addToMealPlan = async (recipe) => {
    try {
      await api.addMeal({
        name: recipe.name,
        day: today,
        meal_type: recipe.category,
        recipe: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        photo: recipePhoto,
      });
      showToast(`Receta añadida a ${today}`);
      setSelectedRecipe(null);
    } catch (e) {
      showToast('Error al añadir: ' + e.message);
    }
  };

  const filteredSuggestions = searchIngredient
    ? Object.fromEntries(
        Object.entries(ingredientCategories).map(([cat, ings]) => [
          cat,
          ings.filter(ing => normalize(ing).includes(normalize(searchIngredient))),
        ]).filter(([, ings]) => ings.length > 0)
      )
    : ingredientCategories;

  if (selectedRecipe) {
    const steps = selectedRecipe.instructions.split('\n').filter(l => l.trim());
    return (
      <div>
        <button onClick={() => setSelectedRecipe(null)} className="neo-btn !bg-gray-100 dark:!text-black dark:!border-gray-400 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> Volver a recetas
        </button>

        <div className="neo-card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedRecipe.name}</h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                  {selectedRecipe.category}
                </span>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span> {selectedRecipe.time}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  selectedRecipe.difficulty === 'Fácil' ? 'text-green-600 bg-green-50 border-green-200' :
                  selectedRecipe.difficulty === 'Media' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }`}>
                  <span className="material-symbols-outlined text-xs">fitness_center</span> {selectedRecipe.difficulty}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-2">Ingredientes</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedRecipe.ingredients.map((ing, i) => {
                const isAvailable = selectedIngredients.some(si => normalize(si).includes(normalize(ing)) || normalize(ing).includes(normalize(si)));
                return (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                    isAvailable
                      ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                      : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                  }`}>
                    {isAvailable ? '✓ ' : ''}{ing}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="neo-card !bg-primary-50 !border-primary-200 mb-4">
          <p className="text-xs font-bold text-primary-700 uppercase mb-3">Instrucciones</p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-extrabold">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-200 pt-0.5">{step.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>
        </div>

        {recipePhoto && (
          <img src={recipePhoto} alt="Foto" className="w-full h-40 object-cover rounded-xl border-2 border-black mb-3" />
        )}
        <div className="flex gap-2 mb-3">
          <button onClick={() => photoInputRef.current?.click()} className="neo-btn flex-1 !text-xs">
            <span className="material-symbols-outlined text-sm align-text-bottom">add_photo_alternate</span> {recipePhoto ? 'Cambiar foto' : 'Añadir foto'}
          </button>
          {recipePhoto && <button onClick={() => setRecipePhoto('')} className="neo-btn !border-red-300 text-red-500 flex-1 !text-xs">
            <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> Quitar foto
          </button>}
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handleRecipePhoto} className="hidden" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => addToMealPlan(selectedRecipe)} className="neo-btn-primary flex-1">
            <span className="material-symbols-outlined text-sm align-text-bottom">playlist_add</span> Añadir a menús
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Recetas</h1>
          <p className="text-sm text-gray-500 font-medium">Elige tus ingredientes y descubre qué cocinar</p>
        </div>
      </div>

      {!showIngredientPicker && !searched && (
        <div className="text-center py-8">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-300 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-5xl text-primary-500">restaurant_menu</span>
          </div>
          <h2 className="text-lg font-extrabold text-gray-700 dark:text-gray-200 mb-2">¿Qué tienes en tu cocina?</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Selecciona los ingredientes que tienes y te diremos qué recetas puedes preparar</p>
          <button onClick={() => setShowIngredientPicker(true)} className="neo-btn-primary !py-3 !px-6">
            <span className="material-symbols-outlined align-text-bottom">kitchen</span> Elegir ingredientes
          </button>
        </div>
      )}

      {showIngredientPicker && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowIngredientPicker(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">Elige tus ingredientes</h2>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
                {selectedIngredients.length} seleccionados
              </span>
            </div>

            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedIngredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 rounded-full px-3 py-1 font-medium flex items-center gap-1">
                    {ing}
                    <button onClick={() => removeIngredient(ing)} className="ml-0.5 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                className="neo-input flex-1"
                placeholder="Añadir ingrediente..."
                value={customIngredient}
                onChange={e => setCustomIngredient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomIngredient()}
              />
              <button onClick={addCustomIngredient} className="neo-btn-primary !px-4">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <input
              className="neo-input mb-3"
              placeholder="Buscar ingrediente..."
              value={searchIngredient}
              onChange={e => setSearchIngredient(e.target.value)}
            />

            <div className="space-y-4 mb-4">
              {Object.entries(filteredSuggestions).map(([category, ings]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      {category === 'Proteínas' ? 'lunch_dining' :
                       category === 'Frutas y Verduras' ? 'eco' :
                       category === 'Lácteos' ? 'water_drop' :
                       category === 'Hidratos' ? 'bakery_dining' :
                       category === 'Conservas' ? 'inventory_2' : 'spa'}
                    </span> {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ings.map((ing, i) => {
                      const isSelected = selectedIngredients.includes(ing);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleIngredient(ing)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-700'
                              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button onClick={searchRecipes} className="neo-btn-primary flex-1" disabled={selectedIngredients.length === 0}>
                <span className="material-symbols-outlined text-sm align-text-bottom">search</span> Buscar recetas
              </button>
              <button onClick={() => setShowIngredientPicker(false)} className="neo-btn !bg-gray-100 dark:!bg-gray-700 flex-1">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {searched && (
        <>
          <div className="neo-card mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500">
                {selectedIngredients.length} ingredientes seleccionados
              </p>
              <div className="flex gap-1">
                <button onClick={() => setShowIngredientPicker(true)} className="text-xs font-bold neo-btn !py-1 !px-2 !border-primary-300 text-primary-600 dark:text-white">
                  <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> Editar
                </button>
                <button onClick={clearAll} className="text-xs font-bold neo-btn !py-1 !px-2 !border-red-300 text-red-500">
                  <span className="material-symbols-outlined text-sm align-text-bottom">close</span> Limpiar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedIngredients.slice(0, 8).map((ing, i) => (
                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 font-medium dark:text-white">{ing}</span>
              ))}
              {selectedIngredients.length > 8 && (
                <span className="text-xs text-gray-400 font-medium">+{selectedIngredients.length - 8}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <select className="neo-input !py-2 !text-xs !px-3" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'Todas' ? 'Todas las comidas' : c}</option>)}
            </select>
            <select className="neo-input !py-2 !text-xs !px-3" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
              {difficulties.map(d => <option key={d} value={d}>{d === 'Todas' ? 'Todas' : d}</option>)}
            </select>
            <button onClick={searchRecipes} className="neo-btn-primary !py-2 !px-4 !text-xs whitespace-nowrap">
              <span className="material-symbols-outlined text-sm align-text-bottom">search</span> Buscar
            </button>
          </div>

          {results.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
              <p className="text-gray-400 font-bold mt-2">No se encontraron recetas</p>
              <p className="text-gray-300 text-sm">Prueba con otros ingredientes o cambia los filtros</p>
            </div>
          )}

          <div className="space-y-3">
            {results.map((recipe, i) => (
              <div key={recipe.id} className="neo-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedRecipe(recipe)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base">{recipe.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        recipe.matchPercent >= 70 ? 'bg-green-100 text-green-700 border border-green-300' :
                        recipe.matchPercent >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                        'bg-orange-100 text-orange-700 border border-orange-300'
                      }`}>
                        {recipe.matchPercent}%
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">schedule</span> {recipe.time}
                      </span>
                      <span className="text-xs text-gray-400">{recipe.difficulty}</span>
                      <span className="text-xs text-gray-400 capitalize">{recipe.category}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-1">Ingredientes ({recipe.matched.length}/{recipe.ingredients.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 5).map((ing, j) => {
                      const has = recipe.matched.includes(ing);
                      return (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded-lg border ${
                          has ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                          {has ? '✓ ' : ''}{ing}
                        </span>
                      );
                    })}
                    {recipe.ingredients.length > 5 && (
                      <span className="text-xs text-gray-400 font-medium">+{recipe.ingredients.length - 5}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 dark:text-white">
                    <span className="material-symbols-outlined text-sm align-text-bottom">visibility</span> Ver receta
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); addToMealPlan(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-primary-300 text-primary-600 dark:text-white">
                    <span className="material-symbols-outlined text-sm align-text-bottom">playlist_add</span> Añadir a menús
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div className="bg-primary-600 text-white font-bold text-sm px-5 py-3 rounded-2xl border-2 border-primary-800 shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
