import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const RECIPE_DB = [
  { id: 'r1', name: 'Pollo al horno con verduras', category: 'comida', time: '50 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Patatas', 'Zanahoria', 'Aceite de oliva', 'Sal', 'Pimienta', 'Ajo'], instructions: '1. Precalienta el horno a 200°C.\n2. Sazona el pollo con sal, pimienta y ajo picado.\n3. Corta las patatas y zanahorias en trozos.\n4. Coloca todo en una bandeja con aceite de oliva.\n5. Hornea durante 45-50 minutos hasta que esté dorado.' },
  { id: 'r2', name: 'Ensalada César', category: 'almuerzo', time: '20 min', difficulty: 'Fácil', ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso parmesano', 'Aceite de oliva', 'Limón', 'Ajo', 'Mostaza'], instructions: '1. Cocina el pollo a la plancha y corta en tiras.\n2. Corta el pan en cubos y tuéstalos en el horno.\n3. Prepara el aliño con aceite, limón, ajo y mostaza.\n4. Mezcla la lechuga con el pollo y los crutones.\n5. Añade el aliño y queso parmesano rallado.' },
  { id: 'r3', name: 'Tacos de pescado', category: 'cena', time: '25 min', difficulty: 'Media', ingredients: ['Pescado blanco', 'Tortillas de maíz', 'Col', 'Crema agria', 'Limón', 'Aguacate', 'Cebolla', 'Cilantro'], instructions: '1. Sazona el pescado con limón y especias.\n2. Cocina el pescado en una sartén caliente.\n3. Calienta las tortillas.\n4. Pica la col, cebolla y cilantro.\n5. Monta los tacos con el pescado y los toppings.' },
  { id: 'r4', name: 'Smoothie verde', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Espinacas', 'Plátano', 'Manzana', 'Jengibre', 'Agua', 'Miel'], instructions: '1. Lava bien las espinacas y la manzana.\n2. Pela el plátano y corta la manzana en trozos.\n3. Añade todo a la licuadora con agua y jengibre.\n4. Licúa hasta obtener una textura suave.\n5. Sirve frío y endulza con miel al gusto.' },
  { id: 'r5', name: 'Omelette de espinacas', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Espinacas', 'Tomate', 'Queso', 'Aceite de oliva', 'Sal'], instructions: '1. Bate los huevos con sal.\n2. Saltea las espinacas y el tomate en una sartén.\n3. Vierte los huevos batidos sobre las verduras.\n4. Añade el queso rallado por encima.\n5. Cocina a fuego bajo hasta que cuaje y dobla.' },
  { id: 'r6', name: 'Pasta primavera', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Ajo', 'Aceite de oliva', 'Albahaca', 'Sal'], instructions: '1. Cocina la pasta al dente según las instrucciones.\n2. Corta las verduras en cubos medianos.\n3. Saltea el ajo y las verduras en aceite de oliva.\n4. Mezcla la pasta con las verduras salteadas.\n5. Sirve con albahaca fresca y un chorrito de aceite.' },
  { id: 'r7', name: 'Arroz con pollo', category: 'comida', time: '40 min', difficulty: 'Media', ingredients: ['Arroz', 'Pollo', 'Cebolla', 'Ajo', 'Pimiento', 'Caldo de pollo', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Dora el pollo en una olla grande con aceite.\n2. Añade la cebolla, ajo y pimiento picados.\n3. Agrega el arroz y remueve durante 2 minutos.\n4. Vierte el caldo caliente y sazona.\n5. Cocina a fuego bajo 20 minutos sin remover.' },
  { id: 'r8', name: 'Hamburguesa casera', category: 'cena', time: '20 min', difficulty: 'Fácil', ingredients: ['Carne picada', 'Pan de hamburguesa', 'Lechuga', 'Tomate', 'Queso cheddar', 'Cebolla', 'Mostaza', 'Ketchup'], instructions: '1. Forma las hamburguesas con la carne picada.\n2. Sazona con sal y pimienta.\n3. Cocina en la plancha 4 minutos por cada lado.\n4. Tuesta los panes y coloca la carne.\n5. Añade lechuga, tomate, queso y salsas.' },
  { id: 'r9', name: 'Tortilla de patatas', category: 'comida', time: '35 min', difficulty: 'Media', ingredients: ['Patatas', 'Huevos', 'Cebolla', 'Aceite de oliva', 'Sal'], instructions: '1. Pela y corta las patatas en rodajas finas.\n2. Fríe las patatas y la cebolla en abundante aceite.\n3. Bate los huevos con sal en un bol grande.\n4. Escurre las patatas y mézclalas con los huevos.\n5. Cuaja la tortilla en la sartén por ambos lados.' },
  { id: 'r10', name: 'Gazpacho andaluz', category: 'almuerzo', time: '15 min', difficulty: 'Fácil', ingredients: ['Tomate', 'Pimiento', 'Pepino', 'Ajo', 'Pan', 'Aceite de oliva', 'Vinagre', 'Sal', 'Agua'], instructions: '1. Lava y trocea los tomates, pimiento y pepino.\n2. Remoja el pan en agua.\n3. Tritura todas las verduras con el pan remojado.\n4. Añade aceite de oliva, vinagre y sal.\n5. Refrigera al menos 2 horas antes de servir.' },
  { id: 'r11', name: 'Crema de calabaza', category: 'comida', time: '35 min', difficulty: 'Fácil', ingredients: ['Calabaza', 'Cebolla', 'Ajo', 'Caldo de verduras', 'Nata', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Pela y corta la calabaza en cubos.\n2. Sofríe la cebolla y el ajo en aceite de oliva.\n3. Añade la calabaza y el caldo.\n4. Cocina 25 minutos hasta que la calabaza esté blanda.\n5. Tritura todo y añade nata al gusto.' },
  { id: 'r12', name: 'Salmón al horno', category: 'cena', time: '25 min', difficulty: 'Fácil', ingredients: ['Salmón', 'Limón', 'Eneldo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Patatas'], instructions: '1. Precalienta el horno a 180°C.\n2. Coloca el salmón en una bandeja.\n3. Sazona con sal, pimienta, limón y eneldo.\n4. Añade patatas cortadas alrededor.\n5. Hornea 20 minutos hasta que el salmón esté en su punto.' },
  { id: 'r13', name: 'Ensalada de quinoa', category: 'almuerzo', time: '25 min', difficulty: 'Fácil', ingredients: ['Quinoa', 'Pepino', 'Tomate', 'Cebolla', 'Aguacate', 'Limón', 'Aceite de oliva', 'Sal'], instructions: '1. Cocina la quinoa según las instrucciones y deja enfriar.\n2. Corta el pepino, tomate y cebolla en dados.\n3. Pela y corta el aguacate.\n4. Mezcla todo con la quinoa fría.\n5. Aliña con limón, aceite de oliva y sal.' },
  { id: 'r14', name: 'Fajitas de pollo', category: 'cena', time: '25 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Tortillas de trigo', 'Pimiento', 'Cebolla', 'Comino', 'Pimentón', 'Limón', 'Aguacate'], instructions: '1. Corta el pollo en tiras finas.\n2. Marina con comino, pimentón y limón.\n3. Saltea el pollo en una sartén muy caliente.\n4. Añade pimiento y cebolla en tiras.\n5. Sirve en tortillas calientes con aguacate.' },
  { id: 'r15', name: 'Macarrones con tomate', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Macarrones', 'Tomate triturado', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Queso rallado', 'Sal', 'Orégano'], instructions: '1. Cocina los macarrones al dente.\n2. Sofríe la cebolla y el ajo en aceite.\n3. Añade el tomate triturado y orégano.\n4. Cocina la salsa 15 minutos a fuego medio.\n5. Mezcla con la pasta y sirve con queso rallado.' },
  { id: 'r16', name: 'Revuelto de champiñones', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Champiñones', 'Ajo', 'Perejil', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Limpia y lamina los champiñones.\n2. Saltea los champiñones con ajo picado.\n3. Bate los huevos con sal y pimienta.\n4. Añade los huevos a la sartén y remueve.\n5. Sirve con perejil fresco picado.' },
  { id: 'r17', name: 'Lentejas estofadas', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Lentejas', 'Zanahoria', 'Patata', 'Cebolla', 'Ajo', 'Tomate', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Sofríe la cebolla, ajo y zanahoria picados.\n2. Añade el tomate y el pimentón.\n3. Incorpora las lentejas lavadas y la patata.\n4. Cubre con agua y sazona con sal.\n5. Cocina 40 minutos a fuego medio.' },
  { id: 'r18', name: 'Wrap de atún', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Tortillas de trigo', 'Atún en lata', 'Lechuga', 'Tomate', 'Mayonesa', 'Maíz dulce', 'Sal'], instructions: '1. Escurre el atún y mézclalo con mayonesa.\n2. Coloca la lechuga sobre la tortilla.\n3. Añade el atún, tomate picado y maíz.\n4. Sazona con sal al gusto.\n5. Enrolla la tortilla bien apretada.' },
  { id: 'r19', name: 'Patatas bravas', category: 'cena', time: '30 min', difficulty: 'Media', ingredients: ['Patatas', 'Tomate', 'Ajo', 'Pimentón picante', 'Vinagre', 'Aceite de oliva', 'Sal', 'Harina'], instructions: '1. Pela y corta las patatas en trozos irregulares.\n2. Fríe las patatas en aceite abundante.\n3. Prepara la salsa con tomate, ajo, pimentón y vinagre.\n4. Escurre las patatas y colócalas en un plato.\n5. Baña con la salsa brava por encima.' },
  { id: 'r20', name: 'Yogur con granola', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Yogur natural', 'Granola', 'Miel', 'Plátano', 'Fresas', 'Frutos secos'], instructions: '1. Coloca el yogur en un bol.\n2. Corta el plátano y las fresas en rodajas.\n3. Añade la granola por encima.\n4. Decorar con las frutas y frutos secos.\n5. Rocía con miel al gusto.' },
  { id: 'r21', name: 'Paella valenciana', category: 'comida', time: '50 min', difficulty: 'Difícil', ingredients: ['Arroz', 'Pollo', 'Judías verdes', 'Garrofón', 'Tomate', 'Azafrán', 'Aceite de oliva', 'Sal', 'Agua'], instructions: '1. Calienta aceite en la paellera y dora el pollo.\n2. Añade las judías verdes y el tomate rallado.\n3. Incorpora el garrofón y el pimentón.\n4. Agrega el agua y deja hervir 20 minutos.\n5. Añade el arroz y el azafrán, cocina 18 minutos.' },
  { id: 'r22', name: 'Puré de patatas', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Patatas', 'Leche', 'Mantequilla', 'Sal', 'Nuez moscada', 'Pimienta'], instructions: '1. Pela y corta las patatas en trozos.\n2. Hiérvelas en agua con sal hasta que estén tiernas.\n3. Escurre y aplasta las patatas.\n4. Añade mantequilla y leche caliente.\n5. Sazona con nuez moscada y pimienta.' },
  { id: 'r23', name: 'Tostadas de aguacate', category: 'desayuno', time: '10 min', difficulty: 'Fácil', ingredients: ['Pan', 'Aguacate', 'Tomate', 'Limón', 'Aceite de oliva', 'Sal', 'Pimienta', 'Semillas de sésamo'], instructions: '1. Tuesta las rebanadas de pan.\n2. Machaca el aguacate con limón y sal.\n3. Unta el aguacate sobre las tostadas.\n4. Coloca rodajas de tomate encima.\n5. Añade aceite, pimienta y semillas.' },
  { id: 'r24', name: 'Albóndigas en salsa', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Carne picada', 'Pan rallado', 'Huevos', 'Tomate', 'Cebolla', 'Ajo', 'Perejil', 'Harina', 'Aceite de oliva', 'Sal'], instructions: '1. Mezcla la carne con pan rallado, huevo y perejil.\n2. Forma las albóndigas y pásalas por harina.\n3. Fríelas ligeramente en aceite.\n4. Prepara una salsa con tomate, cebolla y ajo.\n5. Cocina las albóndigas en la salsa 25 minutos.' },
  { id: 'r25', name: 'Batido de proteínas', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Leche', 'Plátano', 'Avena', 'Mantequilla de cacahuete', 'Miel', 'Cacao'], instructions: '1. Añade todos los ingredientes a la licuadora.\n2. Licúa hasta obtener una textura homogénea.\n3. Ajusta la consistencia con más leche si es necesario.\n4. Sirve inmediatamente.\n5. Decora con un poco de cacao por encima.' },
  { id: 'r26', name: 'Pollo a la plancha', category: 'comida', time: '15 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Limón'], instructions: '1. Sazona el pollo con sal y pimienta.\n2. Calienta aceite en una sartén.\n3. Cocina el pollo 5 minutos por cada lado.\n4. Añade un chorrito de limón al final.\n5. Sirve caliente.' },
  { id: 'r27', name: 'Ensalada mixta', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Lechuga', 'Tomate', 'Cebolla', 'Atún en lata', 'Aceite de oliva', 'Vinagre', 'Sal'], instructions: '1. Lava y corta la lechuga.\n2. Corta el tomate y la cebolla en rodajas.\n3. Escurre el atún y desmenúzalo.\n4. Mezcla todo en un bol.\n5. Aliña con aceite, vinagre y sal.' },
  { id: 'r28', name: 'Arroz blanco', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Arroz', 'Agua', 'Aceite de oliva', 'Sal', 'Ajo'], instructions: '1. Sofríe el ajo picado en aceite.\n2. Añade el arroz y remueve 1 minuto.\n3. Agrega el doble de agua que de arroz.\n4. Cocina a fuego bajo 18 minutos.\n5. Deja reposar 5 minutos antes de servir.' },
  { id: 'r29', name: 'Huevos revueltos', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Leche', 'Mantequilla', 'Sal', 'Pimienta'], instructions: '1. Bate los huevos con un poco de leche.\n2. Derrite la mantequilla en una sartén.\n3. Vierte los huevos y remueve suavemente.\n4. Cocina a fuego bajo hasta que cuajen.\n5. Sazona con sal y pimienta.' },
  { id: 'r30', name: 'Sopa de fideos', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Caldo de pollo', 'Fideos', 'Pollo', 'Zanahoria', 'Sal'], instructions: '1. Hierve el caldo de pollo.\n2. Añade la zanahoria cortada en rodajas.\n3. Cuando hierva, añade el pollo desmenuzado.\n4. Agrega los fideos y cocina 8 minutos.\n5. Sazona con sal y sirve caliente.' },
  { id: 'r31', name: 'Pasta con atún', category: 'cena', time: '15 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Atún en lata', 'Tomate triturado', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Sal'], instructions: '1. Cocina la pasta al dente.\n2. Sofríe la cebolla y el ajo en aceite.\n3. Añade el tomate triturado y cocina 5 minutos.\n4. Incorpora el atún escurrido.\n5. Mezcla con la pasta y sirve.' },
  { id: 'r32', name: 'Pechuga empanada', category: 'comida', time: '20 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Pan rallado', 'Huevos', 'Harina', 'Aceite de oliva', 'Sal'], instructions: '1. Aplana las pechugas y sazónalas con sal.\n2. Pásalas por harina, huevo batido y pan rallado.\n3. Calienta aceite en una sartén.\n4. Fríe 3 minutos por cada lado hasta que estén doradas.\n5. Escurre sobre papel absorbente.' },
  { id: 'r33', name: 'Ensalada de tomate', category: 'almuerzo', time: '5 min', difficulty: 'Fácil', ingredients: ['Tomate', 'Cebolla', 'Aceite de oliva', 'Vinagre', 'Sal', 'Orégano'], instructions: '1. Corta los tomates en rodajas.\n2. Corta la cebolla en aros finos.\n3. Coloca en un plato alternando capas.\n4. Aliña con aceite, vinagre y sal.\n5. Espolvorea orégano por encima.' },
  { id: 'r34', name: 'Patatas al horno', category: 'comida', time: '40 min', difficulty: 'Fácil', ingredients: ['Patatas', 'Aceite de oliva', 'Sal', 'Pimienta', 'Romero'], instructions: '1. Precalienta el horno a 200°C.\n2. Corta las patatas en cuartos.\n3. Mézclalas con aceite, sal y pimienta.\n4. Coloca en una bandeja con romero.\n5. Hornea 35-40 minutos hasta que estén crujientes.' },
  { id: 'r35', name: 'Crema de zanahoria', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Zanahoria', 'Cebolla', 'Patata', 'Caldo de verduras', 'Nata', 'Aceite de oliva', 'Sal'], instructions: '1. Pela y corta las zanahorias, cebolla y patata.\n2. Sofríe la cebolla en aceite.\n3. Añade las zanahorias y la patata.\n4. Cubre con caldo y cocina 20 minutos.\n5. Tritura todo y añade nata al gusto.' },
  { id: 'r36', name: 'Tortilla francesa', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Sal', 'Aceite de oliva'], instructions: '1. Bate los huevos con sal.\n2. Calienta aceite en una sartén antiadherente.\n3. Vierte los huevos y deja cuajar.\n4. Cuando la base esté firme, dobla por la mitad.\n5. Sirve inmediatamente.' },
  { id: 'r37', name: 'Garbanzos con espinacas', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Garbanzos', 'Espinacas', 'Ajo', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Sofríe el ajo laminado en aceite.\n2. Añade el pimentón y remueve rápido.\n3. Incorpora los garbanzos escurridos.\n4. Añade las espinacas y cocina 5 minutos.\n5. Sazona con sal y sirve.' },
  { id: 'r38', name: 'Pollo con arroz', category: 'comida', time: '30 min', difficulty: 'Fácil', ingredients: ['Pollo', 'Arroz', 'Cebolla', 'Ajo', 'Pimiento', 'Aceite de oliva', 'Sal', 'Caldo de pollo'], instructions: '1. Dora el pollo en una olla con aceite.\n2. Añade cebolla, ajo y pimiento picados.\n3. Agrega el arroz y remueve.\n4. Vierte el caldo caliente.\n5. Cocina 18 minutos a fuego bajo.' },
  { id: 'r39', name: 'Tostada con tomate', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Pan', 'Tomate', 'Aceite de oliva', 'Sal', 'Jamón'], instructions: '1. Tuesta las rebanadas de pan.\n2. Corta un tomate por la mitad.\n3. Restriega el tomate sobre el pan tostado.\n4. Añade aceite de oliva y sal.\n5. Coloca una loncha de jamón encima.' },
  { id: 'r40', name: 'Merluza a la plancha', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Merluza', 'Aceite de oliva', 'Sal', 'Limón', 'Perejil'], instructions: '1. Sazona la merluza con sal.\n2. Calienta aceite en una sartén.\n3. Cocina el pescado 3 minutos por cada lado.\n4. Añade un chorrito de limón.\n5. Decora con perejil fresco.' },
  { id: 'r41', name: 'Ensalada de pasta', category: 'almuerzo', time: '20 min', difficulty: 'Fácil', ingredients: ['Pasta', 'Tomate', 'Pepino', 'Atún en lata', 'Aceitunas', 'Aceite de oliva', 'Sal'], instructions: '1. Cocina la pasta y déjala enfriar.\n2. Corta el tomate y el pepino en dados.\n3. Escurre el atún.\n4. Mezcla todo con las aceitunas.\n5. Aliña con aceite y sal.' },
  { id: 'r42', name: 'Lentejas rápidas', category: 'comida', time: '25 min', difficulty: 'Fácil', ingredients: ['Lentejas', 'Chorizo', 'Patata', 'Cebolla', 'Ajo', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Sofríe cebolla y ajo en aceite.\n2. Añade el pimentón y la patata cortada.\n3. Incorpora las lentejas lavadas.\n4. Cubre con agua y añade el chorizo.\n5. Cocina 20 minutos y sazona con sal.' },
  { id: 'r43', name: 'Quesadillas', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Tortillas de trigo', 'Queso cheddar', 'Pollo', 'Pimiento', 'Cebolla'], instructions: '1. Corta el pollo, pimiento y cebolla en tiras.\n2. Saltea las verduras y el pollo.\n3. Coloca una tortilla en la sartén.\n4. Añade queso y el relleno en una mitad.\n5. Dobla y cocina hasta que el queso se derrita.' },
  { id: 'r44', name: 'Batido de frutas', category: 'desayuno', time: '5 min', difficulty: 'Fácil', ingredients: ['Plátano', 'Fresas', 'Leche', 'Miel', 'Yogur natural'], instructions: '1. Pela el plátano y lava las fresas.\n2. Añade todo a la licuadora.\n3. Agrega la leche y el yogur.\n4. Licúa hasta que quede homogéneo.\n5. Endulza con miel al gusto.' },
  { id: 'r45', name: 'Verduras salteadas', category: 'comida', time: '15 min', difficulty: 'Fácil', ingredients: ['Calabacín', 'Pimiento', 'Cebolla', 'Zanahoria', 'Ajo', 'Aceite de oliva', 'Sal', 'Soja'], instructions: '1. Corta todas las verduras en tiras.\n2. Calienta aceite en un wok o sartén grande.\n3. Saltea la zanahoria primero 3 minutos.\n4. Añade el resto de verduras y el ajo.\n5. Cocina 5 minutos más y sazona.' },
  { id: 'r46', name: 'Croquetas de patata', category: 'cena', time: '30 min', difficulty: 'Media', ingredients: ['Patatas', 'Huevos', 'Pan rallado', 'Harina', 'Queso', 'Aceite de oliva', 'Sal', 'Nuez moscada'], instructions: '1. Hierve las patatas y haz puré.\n2. Mezcla con queso rallado, huevo y nuez moscada.\n3. Forma las croquetas con las manos.\n4. Pásalas por harina, huevo y pan rallado.\n5. Fríe en aceite caliente hasta que estén doradas.' },
  { id: 'r47', name: 'Sándwich mixto', category: 'cena', time: '5 min', difficulty: 'Fácil', ingredients: ['Pan', 'Jamón', 'Queso', 'Mantequilla'], instructions: '1. Unta mantequilla en una cara de cada rebanada.\n2. Coloca jamón y queso entre las rebanadas.\n3. Calienta una sartén o sandwichera.\n4. Tuesta el sándwich por ambos lados.\n5. Sirve caliente hasta que el queso se derrita.' },
  { id: 'r48', name: 'Guiso de patatas con carne', category: 'comida', time: '45 min', difficulty: 'Media', ingredients: ['Patatas', 'Carne picada', 'Cebolla', 'Ajo', 'Tomate triturado', 'Pimiento', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Sofríe cebolla y ajo en aceite.\n2. Añade la carne picada y dora.\n3. Incorpora el tomate y el pimiento.\n4. Añade las patatas cortadas en dados.\n5. Cubre con agua y cocina 30 minutos.' },
  { id: 'r49', name: 'Tortilla de jamón y queso', category: 'cena', time: '10 min', difficulty: 'Fácil', ingredients: ['Huevos', 'Jamón', 'Queso', 'Sal', 'Aceite de oliva'], instructions: '1. Bate los huevos con sal.\n2. Corta el jamón y el queso en trozos pequeños.\n3. Mézclalos con los huevos batidos.\n4. Cocina en sartén con aceite a fuego medio.\n5. Dobla cuando cuaje y sirve.' },
  { id: 'r50', name: 'Ensalada de garbanzos', category: 'almuerzo', time: '10 min', difficulty: 'Fácil', ingredients: ['Garbanzos', 'Tomate', 'Pepino', 'Cebolla', 'Pimiento', 'Aceite de oliva', 'Vinagre', 'Sal'], instructions: '1. Escurre y lava los garbanzos.\n2. Corta el tomate, pepino y cebolla en dados.\n3. Pica el pimiento en trozos pequeños.\n4. Mezcla todo en un bol grande.\n5. Aliña con aceite, vinagre y sal.' },
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
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterDifficulty, setFilterDifficulty] = useState('Todas');
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [toast, setToast] = useState(null);

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
      });
      showToast(`Receta añadida a ${today}`);
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

        <div className="flex gap-2">
          <button onClick={() => addToMealPlan(selectedRecipe)} className="neo-btn-primary flex-1">
            <span className="material-symbols-outlined text-sm align-text-bottom">playlist_add</span> Añadir a menús
          </button>
          <button onClick={() => { navigate('/cooking'); }} className="neo-btn !bg-secondary-50 !text-secondary-600 !border-secondary-300 flex-1">
            <span className="material-symbols-outlined text-sm align-text-bottom">chef</span> Modo cocina
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
                <button onClick={() => setShowIngredientPicker(true)} className="text-xs font-bold neo-btn !py-1 !px-2 !border-primary-300 text-primary-600">
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
                  <button onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1">
                    <span className="material-symbols-outlined text-sm align-text-bottom">visibility</span> Ver receta
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); addToMealPlan(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-primary-300 text-primary-600">
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
