export const CATEGORIES = ['Carne', 'Marisco', 'Verduras', 'Frutas', 'Lácteos', 'Hidratos', 'Conservas', 'Condimentos', 'Congelados', 'Bebidas', 'Otros'];

export const CATEGORY_ICONS = {
  'Carne': 'outdoor_grill',
  'Marisco': 'set_meal',
  'Verduras': 'eco',
  'Frutas': 'nutrition',
  'Lácteos': 'water_drop',
  'Hidratos': 'bakery_dining',
  'Conservas': 'inventory_2',
  'Condimentos': 'spa',
  'Congelados': 'ac_unit',
  'Bebidas': 'local_cafe',
  'Otros': 'inventory_2',
};

export const CATEGORY_EMOJI = {
  'Carne': '🥩',
  'Marisco': '🦐',
  'Verduras': '🥦',
  'Frutas': '🍎',
  'Lácteos': '🧀',
  'Hidratos': '🍞',
  'Conservas': '🥫',
  'Condimentos': '🧂',
  'Congelados': '🧊',
  'Bebidas': '🥤',
  'Otros': '📦',
};

export function autoCategorize(name) {
  const n = name.toLowerCase().trim();
  if (/pollo|ternera|cerdo|carne|filete|chuleta|solomillo|lomo|cordero|hamburguesa|salchicha|tocino|jamón|pavo|conejo|chorizo|mortadela|salchichón|butifarra|fuet|longaniza|secreto|presa|costilla|entrecot|rabo|higado|riñón|seso/i.test(n)) return 'Carne';
  if (/salmón|merluza|atún|bacalao|pescado|gamba|langostino|lubina|dorada|sardina|anchoa|pulpo|calamar|sepia|boquerón|mejillón|almeja|berberecho|vieira|cigala|centollo|nécora|percebe|navaja|bacaladilla|caballa|rape|rodaballo|besugo|trucha|lenguado|pez espada|marisco|pescadilla/i.test(n)) return 'Marisco';
  if (/lechuga|tomate|cebolla|ajo|pimiento|espinaca|brócoli|coliflor|zanahoria|calabacín|berenjena|patata|papa|batata|boniato|verdura|acelga|apio|alcachofa|espárrago|champiñón|seta|hortaliza|rúcula|canónigo|remolacha|nabo|rábano|jengibre|puerro|perejil|albahaca|cilantro|col|repollo|guisante|haba|judía verde|germinado|berro|endibia|pepino/i.test(n)) return 'Verduras';
  if (/manzana|plátano|naranja|limón|fresa|uva|pera|melón|sandía|kiwi|mango|piña|fruta|arándano|cereza|pomelo|higo|ciruela|albaricoque|melocotón|aguacate|coco|papaya|granada|mandarina|frambuesa|mora/i.test(n)) return 'Frutas';
  if (/leche|queso|yogur|mantequilla|nata|crema|lácteo|requesón|cuajada|quesito|mozzarella|parmesano|kefir|ricotta|cottage|gouda|cheddar|huevo/i.test(n)) return 'Lácteos';
  if (/arroz|pasta|macarrón|espagueti|pan|bollo|barra|baguette|molde|integral|tostada|harina|avena|legumbre|lenteja|garbanzo|alubia|judía|garrofón|quinoa|cuscús|trigo|maíz|galleta|bizcocho|magdalena|cereal|mijo|bulgur|sémola|fideo|tallarín|lasaña|canelón|ravioli|gnocchi/i.test(n)) return 'Hidratos';
  if (/lata|conserva|aceituna|encurtido|maíz dulce|tomate frito|tomate triturado|pimiento asado|caldo|sopa|pate|anchoa en lata/i.test(n)) return 'Conservas';
  if (/aceite|sal|pimienta|orégano|canela|especia|laurel|tomillo|romero|curry|pimentón|comino|nuez moscada|clavo|vinagre|mostaza|azafrán|eneldo|salsa|kétchup|mayonesa|miel|sirope|azúcar|edulcorante|levadura|bicarbonato/i.test(n)) return 'Condimentos';
  if (/congelado|helado|hielo|pizza congelada/i.test(n)) return 'Congelados';
  if (/agua|refresco|zumo|vino|cerveza|café|té|infusión|leche vegetal|bebida|cola|gaseosa|sidra|ron|whisky|vodka|licor/i.test(n)) return 'Bebidas';
  return 'Otros';
}
