import type { PoiType } from "@/lib/schemas/poi";

export interface MenuItem {
  id: string;
  name: string;
  priceCents: number;
  description: string;
}

const BEER_MENU: MenuItem[] = [
  { id: "draft-ipa",  name: "Draft IPA",     priceCents: 900,  description: "Hoppy local IPA, 16oz" },
  { id: "lager",      name: "Lager",          priceCents: 800,  description: "Crisp stadium lager, 16oz" },
  { id: "cider",      name: "Apple Cider",    priceCents: 1000, description: "Sparkling dry cider, 12oz" },
  { id: "nachos",     name: "Nachos",         priceCents: 700,  description: "Tortilla chips, salsa, jalapeños" },
];

const BURGER_MENU: MenuItem[] = [
  { id: "burger",     name: "Beef Burger",    priceCents: 1200, description: "Double patty, lettuce, tomato" },
  { id: "veggie-wrap",name: "Veggie Wrap",    priceCents: 1000, description: "Grilled veg, hummus, spinach" },
  { id: "hot-dog",    name: "Hot Dog",        priceCents: 800,  description: "Classic frank, mustard, ketchup" },
  { id: "fries",      name: "Fries",          priceCents: 600,  description: "Crispy seasoned fries" },
];

const VEG_MENU: MenuItem[] = [
  { id: "veggie-wrap",name: "Veggie Wrap",    priceCents: 1000, description: "Grilled veg, hummus, spinach" },
  { id: "falafel",    name: "Falafel Pita",   priceCents: 1100, description: "Baked falafel, tahini, pickles" },
  { id: "fries",      name: "Fries",          priceCents: 600,  description: "Crispy seasoned fries" },
  { id: "water",      name: "Bottled Water",  priceCents: 300,  description: "500ml still water" },
];

const COFFEE_MENU: MenuItem[] = [
  { id: "latte",      name: "Latte",          priceCents: 550,  description: "Double shot, steamed milk" },
  { id: "espresso",   name: "Espresso",       priceCents: 350,  description: "Single origin double shot" },
  { id: "hot-choc",   name: "Hot Chocolate",  priceCents: 500,  description: "Rich dark chocolate" },
  { id: "muffin",     name: "Blueberry Muffin",priceCents: 450, description: "Fresh-baked, double blueberry" },
];

const PIZZA_MENU: MenuItem[] = [
  { id: "pepperoni",  name: "Pepperoni Slice",priceCents: 900,  description: "Classic pepperoni, mozzarella" },
  { id: "margherita", name: "Margherita Slice",priceCents: 800, description: "San Marzano tomato, basil" },
  { id: "garlic-bread",name: "Garlic Bread",  priceCents: 450,  description: "Toasted ciabatta, garlic butter" },
  { id: "fries",      name: "Fries",          priceCents: 600,  description: "Crispy seasoned fries" },
];

const DESSERT_MENU: MenuItem[] = [
  { id: "ice-cream",  name: "Ice Cream Cup",  priceCents: 700,  description: "Two scoops, chocolate or vanilla" },
  { id: "churros",    name: "Churros",        priceCents: 650,  description: "Cinnamon sugar, dipping sauce" },
  { id: "waffle",     name: "Mini Waffles",   priceCents: 800,  description: "Three waffles, maple syrup" },
  { id: "water",      name: "Bottled Water",  priceCents: 300,  description: "500ml still water" },
];

const DEFAULT_FOOD_MENU = BURGER_MENU;

const POI_MENUS: Record<string, MenuItem[]> = {
  "food-burger":  BURGER_MENU,
  "food-veg":     VEG_MENU,
  "food-beer":    BEER_MENU,
  "food-coffee":  COFFEE_MENU,
  "food-pizza":   PIZZA_MENU,
  "food-dessert": DESSERT_MENU,
};

export function getMenuFor(poiType: PoiType): MenuItem[] {
  if (poiType === "food") return DEFAULT_FOOD_MENU;
  return [];
}

export function getMenuForPoi(poiId: string): MenuItem[] {
  return POI_MENUS[poiId] ?? [];
}
