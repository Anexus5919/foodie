import {
  type User,
  type InsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Dish,
  type InsertDish,
  type MenuCategory,
  type InsertMenuCategory,
  type Order,
  type InsertOrder,
  type Address,
  type InsertAddress,
  type DeliveryPartner,
  type InsertDeliveryPartner,
  type Coupon,
  type DishReview,
  type InsertDishReview,
} from "../shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser> & { email: string; name: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantByOwner(ownerId: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant | undefined>;

  // Menu Categories
  getMenuCategories(restaurantId: string): Promise<MenuCategory[]>;
  createMenuCategory(category: InsertMenuCategory): Promise<MenuCategory>;

  // Dishes
  getDishes(restaurantId: string): Promise<Dish[]>;
  getDish(id: string): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  updateDish(id: string, data: Partial<Dish>): Promise<Dish | undefined>;

  // Orders
  getOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByRestaurant(restaurantId: string): Promise<Order[]>;
  getAvailableOrdersForDelivery(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;

  // Addresses
  getAddresses(userId: string): Promise<Address[]>;
  getAddress(id: string): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  deleteAddress(id: string): Promise<void>;

  // Delivery Partners
  getDeliveryPartner(userId: string): Promise<DeliveryPartner | undefined>;
  createDeliveryPartner(partner: InsertDeliveryPartner): Promise<DeliveryPartner>;
  updateDeliveryPartner(userId: string, data: Partial<DeliveryPartner>): Promise<DeliveryPartner | undefined>;

  // Coupons
  getCoupon(code: string): Promise<Coupon | undefined>;
  validateCoupon(code: string, orderAmount: number, restaurantId?: string): Promise<Coupon | null>;

  // Reviews
  createDishReview(review: InsertDishReview): Promise<DishReview>;
  getDishReviews(dishId: string): Promise<DishReview[]>;
  getReviewsByRestaurant(restaurantId: string): Promise<DishReview[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private restaurants: Map<string, Restaurant> = new Map();
  private menuCategories: Map<string, MenuCategory> = new Map();
  private dishes: Map<string, Dish> = new Map();
  private orders: Map<string, Order> = new Map();
  private addresses: Map<string, Address> = new Map();
  private deliveryPartners: Map<string, DeliveryPartner> = new Map();
  private coupons: Map<string, Coupon> = new Map();
  private dishReviews: Map<string, DishReview> = new Map();

  // Persistence file path
  private REVIEWS_FILE = path.join(process.cwd(), "reviews.json");

  constructor() {
    this.seedData();
    this.loadReviews();
  }

  // --- PERSISTENCE HELPERS ---
  private loadReviews() {
    try {
      if (fs.existsSync(this.REVIEWS_FILE)) {
        const data = fs.readFileSync(this.REVIEWS_FILE, "utf-8");
        const reviewsArray = JSON.parse(data);
        // Re-hydrate the Map from the array of entries
        this.dishReviews = new Map(reviewsArray);
      }
    } catch (error) {
      console.warn("Failed to load reviews from persistence file:", error);
    }
  }

  private saveReviews() {
    try {
      // Convert Map to array of entries for JSON serialization
      const data = JSON.stringify(Array.from(this.dishReviews.entries()));
      fs.writeFileSync(this.REVIEWS_FILE, data);
    } catch (error) {
      console.warn("Failed to save reviews to persistence file:", error);
    }
  }

  // --- REAL-TIME SIMULATION ENGINE ---
  private simulateOrderProgress(order: Order): Order {
    if (["delivered", "cancelled"].includes(order.status)) return order;

    const now = new Date();
    const createdAt = new Date(order.createdAt || now);
    const elapsedSeconds = (now.getTime() - createdAt.getTime()) / 1000;

    const TIME_TO_ACCEPT = 10;
    const TIME_TO_PREPARE = 25;
    const TIME_TO_READY = 45;
    const TIME_TO_PICKUP = 60;
    const TIME_TO_DELIVER = 120; 

    const updated = { ...order };
    let changed = false;

    if (elapsedSeconds > TIME_TO_ACCEPT && order.status === "pending") {
      updated.status = "accepted";
      updated.acceptedAt = now;
      changed = true;
    } else if (elapsedSeconds > TIME_TO_PREPARE && order.status === "accepted") {
      updated.status = "preparing";
      updated.preparingAt = now;
      changed = true;
    } else if (elapsedSeconds > TIME_TO_READY && order.status === "preparing") {
      updated.status = "ready";
      updated.readyAt = now;
      changed = true;
    } else if (elapsedSeconds > TIME_TO_PICKUP && order.status === "ready") {
      updated.status = "picked_up";
      updated.pickedUpAt = now;
      updated.deliveryPartnerId = "simulated-driver-1";
      changed = true;
    } else if (elapsedSeconds > TIME_TO_DELIVER && order.status === "picked_up") {
      updated.status = "delivered";
      updated.deliveredAt = now;
      changed = true;
    }

    if (updated.status === "picked_up") {
      const restaurant = this.restaurants.get(order.restaurantId);
      const address = order.addressId ? this.addresses.get(order.addressId) : null;

      if (restaurant && address && restaurant.latitude && restaurant.longitude && address.latitude && address.longitude) {
        const startLat = Number(restaurant.latitude);
        const startLng = Number(restaurant.longitude);
        const endLat = Number(address.latitude);
        const endLng = Number(address.longitude);

        const totalTravelTime = TIME_TO_DELIVER - TIME_TO_PICKUP;
        const currentTravelTime = elapsedSeconds - TIME_TO_PICKUP;
        const progress = Math.min(Math.max(currentTravelTime / totalTravelTime, 0), 1);

        const currentLat = startLat + (endLat - startLat) * progress;
        const currentLng = startLng + (endLng - startLng) * progress;
        const jitter = (Math.random() - 0.5) * 0.0005; 
        
        updated.deliveryPartnerLocation = {
          lat: currentLat + jitter,
          lng: currentLng + jitter
        };
        changed = true;
      }
    }

    const remainingSeconds = Math.max(0, TIME_TO_DELIVER - elapsedSeconds);
    updated.estimatedDeliveryTime = Math.ceil(remainingSeconds / 60);

    if (changed) {
      this.orders.set(order.id, updated);
    }

    return updated;
  }

  private seedData() {
    // === SEED RESTAURANTS ===
    const restaurants: Restaurant[] = [
      {
        id: "rest-1",
        ownerId: null,
        name: "Tandoori Nights",
        description: "Authentic North Indian cuisine with signature tandoor dishes",
        cuisines: ["North Indian", "Mughlai", "Biryani"],
        imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
        address: "123 Food Street, Koramangala, Bangalore",
        latitude: "12.9352",
        longitude: "77.6245",
        phone: "+91 9876543210",
        email: "tandoori@foodie.com",
        rating: "4.5",
        reviewCount: 324,
        priceRange: 2,
        deliveryTime: 35,
        deliveryFee: "0",
        minOrderAmount: "150",
        isVeg: false,
        isOpen: true,
        openingTime: "11:00",
        closingTime: "23:00",
        hasOffers: true,
        offerText: "50% OFF up to 100",
      },
      {
        id: "rest-2",
        ownerId: null,
        name: "Pizza Paradise",
        description: "Hand-tossed pizzas with fresh ingredients",
        cuisines: ["Italian", "Pizza", "Fast Food"],
        imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=1200&q=80",
        address: "45 Gourmet Lane, Indiranagar, Bangalore",
        latitude: "12.9716",
        longitude: "77.6412",
        phone: "+91 9876543211",
        email: "pizza@foodie.com",
        rating: "4.3",
        reviewCount: 512,
        priceRange: 3,
        deliveryTime: 30,
        deliveryFee: "30",
        minOrderAmount: "200",
        isVeg: false,
        isOpen: true,
        openingTime: "10:00",
        closingTime: "24:00",
        hasOffers: true,
        offerText: "Free delivery",
      },
      {
        id: "rest-3",
        ownerId: null,
        name: "Dragon Wok",
        description: "Authentic Chinese and Pan-Asian delights",
        cuisines: ["Chinese", "Thai", "Asian"],
        imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80",
        address: "78 Spice Road, HSR Layout, Bangalore",
        latitude: "12.9121",
        longitude: "77.6446",
        phone: "+91 9876543212",
        email: "dragon@foodie.com",
        rating: "4.2",
        reviewCount: 289,
        priceRange: 2,
        deliveryTime: 40,
        deliveryFee: "20",
        minOrderAmount: "150",
        isVeg: false,
        isOpen: true,
        openingTime: "11:30",
        closingTime: "22:30",
        hasOffers: false,
        offerText: null,
      },
      {
        id: "rest-4",
        ownerId: null,
        name: "Green Bowl",
        description: "Healthy salads and nutritious bowls",
        cuisines: ["Healthy", "Salads", "Continental"],
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80",
        address: "12 Health Avenue, Whitefield, Bangalore",
        latitude: "12.9698",
        longitude: "77.7499",
        phone: "+91 9876543213",
        email: "green@foodie.com",
        rating: "4.6",
        reviewCount: 178,
        priceRange: 3,
        deliveryTime: 25,
        deliveryFee: "0",
        minOrderAmount: "200",
        isVeg: true,
        isOpen: true,
        openingTime: "08:00",
        closingTime: "21:00",
        hasOffers: true,
        offerText: "20% OFF",
      },
      {
        id: "rest-5",
        ownerId: null,
        name: "Burger Barn",
        description: "Juicy burgers and crispy fries",
        cuisines: ["Burgers", "American", "Fast Food"],
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80",
        address: "56 Burger Street, Marathahalli, Bangalore",
        latitude: "12.9591",
        longitude: "77.6974",
        phone: "+91 9876543214",
        email: "burger@foodie.com",
        rating: "4.1",
        reviewCount: 445,
        priceRange: 2,
        deliveryTime: 20,
        deliveryFee: "15",
        minOrderAmount: "100",
        isVeg: false,
        isOpen: true,
        openingTime: "10:00",
        closingTime: "23:00",
        hasOffers: true,
        offerText: "Buy 1 Get 1 Free",
      },
      {
        id: "rest-6",
        ownerId: null,
        name: "Dosa Plaza",
        description: "Crispy dosas and authentic South Indian flavors",
        cuisines: ["South Indian", "Dosa", "Idli"],
        imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coverImageUrl: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=1200&q=80",
        address: "34 Temple Road, Jayanagar, Bangalore",
        latitude: "12.9299",
        longitude: "77.5933",
        phone: "+91 9876543215",
        email: "dosa@foodie.com",
        rating: "4.4",
        reviewCount: 623,
        priceRange: 1,
        deliveryTime: 25,
        deliveryFee: "0",
        minOrderAmount: "80",
        isVeg: true,
        isOpen: true,
        openingTime: "07:00",
        closingTime: "22:00",
        hasOffers: false,
        offerText: null,
      },
      {
        id: "rest-7",
        ownerId: null,
        name: "Royal Biryani House",
        description: "The finest Hyderabadi and Lucknowi Biryanis",
        cuisines: ["Biryani", "Mughlai", "North Indian"],
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&q=80",
        address: "88 Mosque Road, Frazer Town, Bangalore",
        latitude: "12.9969",
        longitude: "77.6135",
        phone: "+91 9876543216",
        email: "royalbiryani@foodie.com",
        rating: "4.7",
        reviewCount: 890,
        priceRange: 2,
        deliveryTime: 45,
        deliveryFee: "25",
        minOrderAmount: "250",
        isVeg: false,
        isOpen: true,
        openingTime: "11:00",
        closingTime: "23:30",
        hasOffers: true,
        offerText: "Flat 100 OFF",
      },
      {
        id: "rest-8",
        ownerId: null,
        name: "Sweet Cravings",
        description: "Desserts, Ice Creams and Shakes",
        cuisines: ["Desserts", "Ice Cream", "Beverages"],
        imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1605807646983-377bc5a76493?q=80&w=1024&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        address: "21 Sugar Lane, MG Road, Bangalore",
        latitude: "12.9749",
        longitude: "77.6083",
        phone: "+91 9876543217",
        email: "sweets@foodie.com",
        rating: "4.8",
        reviewCount: 412,
        priceRange: 2,
        deliveryTime: 20,
        deliveryFee: "10",
        minOrderAmount: "100",
        isVeg: true,
        isOpen: true,
        openingTime: "10:00",
        closingTime: "00:00",
        hasOffers: true,
        offerText: "Free Choco Chip with Order > 200",
      },
      {
        id: "rest-9",
        ownerId: null,
        name: "Pasta La Vista",
        description: "Handmade pasta and authentic Italian sauces",
        cuisines: ["Italian", "Pasta", "Continental"],
        imageUrl: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200&q=80",
        address: "55 Roman Road, Indiranagar, Bangalore",
        latitude: "12.9784",
        longitude: "77.6408",
        phone: "+91 9876543218",
        email: "pasta@foodie.com",
        rating: "4.5",
        reviewCount: 220,
        priceRange: 3,
        deliveryTime: 35,
        deliveryFee: "20",
        minOrderAmount: "200",
        isVeg: false,
        isOpen: true,
        openingTime: "11:00",
        closingTime: "23:00",
        hasOffers: false,
        offerText: null,
      },
      {
        id: "rest-10",
        ownerId: null,
        name: "Sushi Sensation",
        description: "Fresh sushi and Japanese delicacies",
        cuisines: ["Japanese", "Sushi", "Asian"],
        imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80",
        address: "10 Zen Garden, UB City, Bangalore",
        latitude: "12.9719",
        longitude: "77.5966",
        phone: "+91 9876543219",
        email: "sushi@foodie.com",
        rating: "4.9",
        reviewCount: 560,
        priceRange: 4,
        deliveryTime: 45,
        deliveryFee: "50",
        minOrderAmount: "500",
        isVeg: false,
        isOpen: true,
        openingTime: "12:00",
        closingTime: "23:00",
        hasOffers: true,
        offerText: "20% OFF on Sushi Platters",
      },
      {
        id: "rest-11",
        ownerId: null,
        name: "Taco Town",
        description: "Mexican tacos, burritos and quesadillas",
        cuisines: ["Mexican", "Tacos", "Fast Food"],
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        address: "42 Fiesta Street, Koramangala, Bangalore",
        latitude: "12.9345",
        longitude: "77.6156",
        phone: "+91 9876543220",
        email: "taco@foodie.com",
        rating: "4.2",
        reviewCount: 180,
        priceRange: 2,
        deliveryTime: 25,
        deliveryFee: "15",
        minOrderAmount: "150",
        isVeg: false,
        isOpen: true,
        openingTime: "11:00",
        closingTime: "22:00",
        hasOffers: true,
        offerText: "Buy 2 Tacos Get 1 Free",
      },
      {
        id: "rest-12",
        ownerId: null,
        name: "Curry House",
        description: "Spicy and flavorful Indian curries",
        cuisines: ["North Indian", "Curry", "Thali"],
        imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80",
        coverImageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80",
        address: "77 Spice Bazaar, Jayanagar, Bangalore",
        latitude: "12.9255",
        longitude: "77.5910",
        phone: "+91 9876543221",
        email: "curry@foodie.com",
        rating: "4.4",
        reviewCount: 310,
        priceRange: 2,
        deliveryTime: 35,
        deliveryFee: "0",
        minOrderAmount: "120",
        isVeg: true,
        isOpen: true,
        openingTime: "11:30",
        closingTime: "23:00",
        hasOffers: false,
        offerText: null,
      }
    ];

    restaurants.forEach((r) => this.restaurants.set(r.id, r));

    // === SEED MENU CATEGORIES ===
    const categories: MenuCategory[] = [
      // Tandoori Nights
      { id: "cat-1", restaurantId: "rest-1", name: "Starters", description: "Appetizers", sortOrder: 1 },
      { id: "cat-2", restaurantId: "rest-1", name: "Main Course", description: "Curries", sortOrder: 2 },
      { id: "cat-3", restaurantId: "rest-1", name: "Breads", description: "Indian Breads", sortOrder: 3 },
      { id: "cat-4", restaurantId: "rest-1", name: "Rice", description: "Basmati Specials", sortOrder: 4 },
      // Pizza Paradise
      { id: "cat-5", restaurantId: "rest-2", name: "Classic Pizzas", description: "Traditional", sortOrder: 1 },
      { id: "cat-6", restaurantId: "rest-2", name: "Premium Pizzas", description: "Loaded toppings", sortOrder: 2 },
      { id: "cat-7", restaurantId: "rest-2", name: "Sides", description: "Breads & Dips", sortOrder: 3 },
      // Dragon Wok
      { id: "cat-8", restaurantId: "rest-3", name: "Noodles", description: "Wok Specials", sortOrder: 1 },
      { id: "cat-9", restaurantId: "rest-3", name: "Rice", description: "Fried Rice", sortOrder: 2 },
      { id: "cat-10", restaurantId: "rest-3", name: "Starters", description: "Dimsums & Rolls", sortOrder: 3 },
      // Green Bowl
      { id: "cat-11", restaurantId: "rest-4", name: "Signature Salads", description: "Chef's Choice", sortOrder: 1 },
      { id: "cat-12", restaurantId: "rest-4", name: "Warm Bowls", description: "Grain Bowls", sortOrder: 2 },
      { id: "cat-13", restaurantId: "rest-4", name: "Smoothies", description: "Fresh Blends", sortOrder: 3 },
      // Burger Barn
      { id: "cat-14", restaurantId: "rest-5", name: "Chicken Burgers", description: "Juicy Patties", sortOrder: 1 },
      { id: "cat-15", restaurantId: "rest-5", name: "Veg Burgers", description: "Crispy Veg", sortOrder: 2 },
      { id: "cat-16", restaurantId: "rest-5", name: "Sides", description: "Fries & Wings", sortOrder: 3 },
      // Dosa Plaza
      { id: "cat-17", restaurantId: "rest-6", name: "Dosas", description: "Crispy Crepes", sortOrder: 1 },
      { id: "cat-18", restaurantId: "rest-6", name: "Idlis & Vadas", description: "Steamed Snacks", sortOrder: 2 },
      { id: "cat-19", restaurantId: "rest-6", name: "Uttapams", description: "Thick Pancakes", sortOrder: 3 },
      // Royal Biryani
      { id: "cat-20", restaurantId: "rest-7", name: "Hyderabadi Biryani", description: "Spicy", sortOrder: 1 },
      { id: "cat-21", restaurantId: "rest-7", name: "Lucknowi Biryani", description: "Aromatic", sortOrder: 2 },
      { id: "cat-22", restaurantId: "rest-7", name: "Kebabs", description: "Starters", sortOrder: 3 },
      // Sweet Cravings
      { id: "cat-23", restaurantId: "rest-8", name: "Cakes", description: "Slices & Whole", sortOrder: 1 },
      { id: "cat-24", restaurantId: "rest-8", name: "Ice Creams", description: "Scoops & Tubs", sortOrder: 2 },
      { id: "cat-25", restaurantId: "rest-8", name: "Shakes", description: "Thick Shakes", sortOrder: 3 },
      // Pasta La Vista
      { id: "cat-26", restaurantId: "rest-9", name: "Pasta", description: "Penne & Spaghetti", sortOrder: 1 },
      { id: "cat-27", restaurantId: "rest-9", name: "Lasagna", description: "Baked Layers", sortOrder: 2 },
      { id: "cat-28", restaurantId: "rest-9", name: "Antipasti", description: "Starters", sortOrder: 3 },
      // Sushi Sensation
      { id: "cat-29", restaurantId: "rest-10", name: "Maki Rolls", description: "Rolled Sushi", sortOrder: 1 },
      { id: "cat-30", restaurantId: "rest-10", name: "Nigiri", description: "Fish on Rice", sortOrder: 2 },
      { id: "cat-31", restaurantId: "rest-10", name: "Sashimi", description: "Sliced Fish", sortOrder: 3 },
      // Taco Town
      { id: "cat-32", restaurantId: "rest-11", name: "Tacos", description: "Soft & Hard Shell", sortOrder: 1 },
      { id: "cat-33", restaurantId: "rest-11", name: "Burritos", description: "Wraps", sortOrder: 2 },
      { id: "cat-34", restaurantId: "rest-11", name: "Nachos", description: "Loaded Chips", sortOrder: 3 },
      // Curry House
      { id: "cat-35", restaurantId: "rest-12", name: "Paneer Curries", description: "Cottage Cheese", sortOrder: 1 },
      { id: "cat-36", restaurantId: "rest-12", name: "Veg Curries", description: "Mixed Veg", sortOrder: 2 },
      { id: "cat-37", restaurantId: "rest-12", name: "Dal", description: "Lentils", sortOrder: 3 },
    ];

    categories.forEach((c) => this.menuCategories.set(c.id, c));

    // ================= DISHES (10+ per restaurant) =================
    const dishes: Dish[] = [
      // --- Rest 1: Tandoori Nights ---
      { id: "d1-1", restaurantId: "rest-1", categoryId: "cat-1", name: "Paneer Tikka", description: "Grilled cottage cheese", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80", price: "249", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 120, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Regular", preparationTime: 20, customizations: null },
      { id: "d1-2", restaurantId: "rest-1", categoryId: "cat-2", name: "Butter Chicken", description: "Rich tomato gravy", imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80", price: "349", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 300, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 2, portionSize: "Regular", preparationTime: 25, customizations: null },
      { id: "d1-3", restaurantId: "rest-1", categoryId: "cat-3", name: "Butter Naan", description: "Soft bread", imageUrl: "https://images.unsplash.com/photo-1655979284091-eea0e93405ee?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "59", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 100, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d1-4", restaurantId: "rest-1", categoryId: "cat-1", name: "Chicken Tikka", description: "Spicy grilled chicken", imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", price: "320", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 200, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 3, portionSize: "8 pcs", preparationTime: 20, customizations: null },
      { id: "d1-5", restaurantId: "rest-1", categoryId: "cat-2", name: "Dal Makhani", description: "Creamy lentils", imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80", price: "249", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 250, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 20, customizations: null },
      { id: "d1-6", restaurantId: "rest-1", categoryId: "cat-2", name: "Paneer Butter Masala", description: "Rich gravy", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", price: "289", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 180, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Regular", preparationTime: 20, customizations: null },
      { id: "d1-7", restaurantId: "rest-1", categoryId: "cat-3", name: "Garlic Naan", description: "Flavorful bread", imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1371&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "69", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 110, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d1-8", restaurantId: "rest-1", categoryId: "cat-4", name: "Jeera Rice", description: "Cumin rice", imageUrl: "https://lentillovingfamily.com/wp-content/uploads/2025/08/jeera-rice-1.jpg", price: "149", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d1-9", restaurantId: "rest-1", categoryId: "cat-4", name: "Veg Biryani", description: "Spiced rice & veg", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", price: "229", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 150, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Regular", preparationTime: 25, customizations: null },
      { id: "d1-10", restaurantId: "rest-1", categoryId: "cat-1", name: "Samosa Platter", description: "Crispy potato pockets", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", price: "129", isVeg: true, isAvailable: true, rating: "4.2", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "4 pcs", preparationTime: 15, customizations: null },

      // --- Rest 2: Pizza Paradise ---
      { id: "d2-1", restaurantId: "rest-2", categoryId: "cat-5", name: "Margherita", description: "Cheese & Basil", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80", price: "299", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-2", restaurantId: "rest-2", categoryId: "cat-5", name: "Pepperoni", description: "Spicy Pork", imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80", price: "399", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 250, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-3", restaurantId: "rest-2", categoryId: "cat-5", name: "Farmhouse", description: "Loaded Veggies", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", price: "359", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 180, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-4", restaurantId: "rest-2", categoryId: "cat-5", name: "BBQ Chicken", description: "Smoky Chicken", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80", price: "429", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 210, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 2, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-5", restaurantId: "rest-2", categoryId: "cat-6", name: "Veggie Paradise", description: "Corn, Capsicum, Onion", imageUrl: "https://dbigmart.com/wp-content/uploads/2022/10/33333333333.jpg", price: "379", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 120, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-6", restaurantId: "rest-2", categoryId: "cat-7", name: "Garlic Bread", description: "Buttery Sticks", imageUrl: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?q=80&w=1196&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "129", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 150, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "4 pcs", preparationTime: 10, customizations: null },
      { id: "d2-7", restaurantId: "rest-2", categoryId: "cat-7", name: "Cheese Dip", description: "Jalapeno Dip", imageUrl: "https://images.unsplash.com/photo-1734772257288-d53770c7707f?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "49", isVeg: true, isAvailable: true, rating: "4.2", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Dip", preparationTime: 0, customizations: null },
      { id: "d2-8", restaurantId: "rest-2", categoryId: "cat-5", name: "Mushroom Riot", description: "Overload Mushroom", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", price: "369", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 90, isBestseller: false, isNew: true, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Medium", preparationTime: 20, customizations: null },
      { id: "d2-9", restaurantId: "rest-2", categoryId: "cat-7", name: "Choco Lava Cake", description: "Molten Chocolate", imageUrl: "https://images.getrecipekit.com/20250325120225-how-20to-20make-20chocolate-20molten-20lava-20cake-20in-20the-20microwave.png?width=650&quality=90&", price: "99", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 300, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d2-10", restaurantId: "rest-2", categoryId: "cat-5", name: "Chicken Sausage", description: "Classic Sausage", imageUrl: "https://plus.unsplash.com/premium_photo-1733306588881-0411931d4fed?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "389", isVeg: false, isAvailable: true, rating: "4.3", reviewCount: 140, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Medium", preparationTime: 20, customizations: null },

      // --- Rest 3: Dragon Wok ---
      { id: "d3-1", restaurantId: "rest-3", categoryId: "cat-8", name: "Veg Hakka Noodles", description: "Classic stir fry", imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: "199", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 100, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d3-2", restaurantId: "rest-3", categoryId: "cat-8", name: "Schezwan Noodles", description: "Spicy chilli garlic", imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80", price: "219", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 120, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 3, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d3-3", restaurantId: "rest-3", categoryId: "cat-9", name: "Fried Rice", description: "Veggie mix", imageUrl: "https://images.unsplash.com/photo-1603133872878-684f10842f8d?w=400&q=80", price: "209", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 110, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d3-4", restaurantId: "rest-3", categoryId: "cat-10", name: "Veg Momos", description: "Steamed dumplings", imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80", price: "129", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "6 pcs", preparationTime: 15, customizations: null },
      { id: "d3-5", restaurantId: "rest-3", categoryId: "cat-10", name: "Chicken Momos", description: "Juicy filling", imageUrl: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=400&q=80", price: "149", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 250, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "6 pcs", preparationTime: 15, customizations: null },
      { id: "d3-6", restaurantId: "rest-3", categoryId: "cat-10", name: "Spring Rolls", description: "Crispy rolls", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80", price: "169", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "4 pcs", preparationTime: 15, customizations: null },
      { id: "d3-7", restaurantId: "rest-3", categoryId: "cat-8", name: "Chicken Noodles", description: "Wok tossed chicken", imageUrl: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80", price: "249", isVeg: false, isAvailable: true, rating: "4.5", reviewCount: 130, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d3-8", restaurantId: "rest-3", categoryId: "cat-10", name: "Manchow Soup", description: "Spicy crunch", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80", price: "119", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d3-9", restaurantId: "rest-3", categoryId: "cat-8", name: "American Chopsuey", description: "Crispy noodles", imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80", price: "259", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 70, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 20, customizations: null },
      { id: "d3-10", restaurantId: "rest-3", categoryId: "cat-10", name: "Chilli Chicken", description: "Spicy starter", imageUrl: "https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=400&q=80", price: "279", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 3, portionSize: "Regular", preparationTime: 20, customizations: null },

      // --- Rest 4: Green Bowl ---
      { id: "d4-1", restaurantId: "rest-4", categoryId: "cat-11", name: "Greek Salad", description: "Feta & Olives", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", price: "279", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 120, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d4-2", restaurantId: "rest-4", categoryId: "cat-11", name: "Caesar Salad", description: "Crunchy croutons", imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80", price: "259", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d4-3", restaurantId: "rest-4", categoryId: "cat-12", name: "Quinoa Bowl", description: "Protein packed", imageUrl: "https://images.unsplash.com/photo-1615865417491-9941019fbc00?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "329", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 80, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d4-4", restaurantId: "rest-4", categoryId: "cat-13", name: "Berry Blast", description: "Antioxidant smoothie", imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=686&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "189", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 110, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d4-5", restaurantId: "rest-4", categoryId: "cat-13", name: "Green Detox", description: "Spinach & Apple", imageUrl: "https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&q=80", price: "179", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 70, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d4-6", restaurantId: "rest-4", categoryId: "cat-11", name: "Pasta Salad", description: "Cold pasta & veggies", imageUrl: "https://images.unsplash.com/photo-1543161252-42609aa0e3d2?q=80&w=1017&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "249", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 60, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d4-7", restaurantId: "rest-4", categoryId: "cat-12", name: "Burrito Bowl", description: "Mexican beans & rice", imageUrl: "https://images.unsplash.com/photo-1668665771757-4d42737d295a?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "349", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 140, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d4-8", restaurantId: "rest-4", categoryId: "cat-13", name: "Mango Tango", description: "Seasonal mango", imageUrl: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80", price: "199", isVeg: true, isAvailable: true, rating: "4.9", reviewCount: 200, isBestseller: true, isNew: true, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d4-9", restaurantId: "rest-4", categoryId: "cat-12", name: "Tofu Teriyaki", description: "Asian style bowl", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", price: "319", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d4-10", restaurantId: "rest-4", categoryId: "cat-11", name: "Fruit Bowl", description: "Seasonal cut fruits", imageUrl: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "159", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 100, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Bowl", preparationTime: 10, customizations: null },

      // --- Rest 5: Burger Barn ---
      { id: "d5-1", restaurantId: "rest-5", categoryId: "cat-14", name: "Classic Chicken", description: "Grilled patty", imageUrl: "https://media-cdn.tripadvisor.com/media/photo-m/1280/1b/fb/ae/e6/classic-chicken-burger.jpg", price: "199", isVeg: false, isAvailable: true, rating: "4.5", reviewCount: 220, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d5-2", restaurantId: "rest-5", categoryId: "cat-15", name: "Veggie Supreme", description: "Loaded potato patty", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80", price: "169", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d5-3", restaurantId: "rest-5", categoryId: "cat-16", name: "Peri Peri Fries", description: "Spicy seasoning", imageUrl: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&q=80", price: "119", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 250, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Regular", preparationTime: 10, customizations: null },
      { id: "d5-4", restaurantId: "rest-5", categoryId: "cat-14", name: "Crispy Chicken", description: "Fried chicken patty", imageUrl: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?q=80&w=721&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "219", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 190, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d5-5", restaurantId: "rest-5", categoryId: "cat-15", name: "Paneer Burger", description: "Cottage cheese slab", imageUrl: "https://images.unsplash.com/photo-1551615593-ef5fe247e8f7?w=400&q=80", price: "189", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 130, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d5-6", restaurantId: "rest-5", categoryId: "cat-16", name: "Chicken Wings", description: "BBQ Sauce", imageUrl: "https://images.unsplash.com/photo-1624153064067-566cae78993d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "249", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "6 pcs", preparationTime: 20, customizations: null },
      { id: "d5-7", restaurantId: "rest-5", categoryId: "cat-16", name: "Cheese Nuggets", description: "Melty center", imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80", price: "149", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 110, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "8 pcs", preparationTime: 10, customizations: null },
      { id: "d5-8", restaurantId: "rest-5", categoryId: "cat-14", name: "Double Decker", description: "Two chicken patties", imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80", price: "299", isVeg: false, isAvailable: true, rating: "4.9", reviewCount: 140, isBestseller: true, isNew: true, isChefSpecial: true, isHealthy: false, spiceLevel: 2, portionSize: "Large", preparationTime: 20, customizations: null },
      { id: "d5-9", restaurantId: "rest-5", categoryId: "cat-16", name: "Coke Float", description: "Soda with ice cream", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFvIIaU6v3G7SK_7gbzHBFsbAnIasE_GiuZA&s", price: "99", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d5-10", restaurantId: "rest-5", categoryId: "cat-15", name: "Aloo Tikki", description: "Classic indian burger", imageUrl: "https://mcdonaldsblog.in/wp-content/uploads/2018/04/McAloo-tikki.jpg", price: "99", isVeg: true, isAvailable: true, rating: "4.2", reviewCount: 300, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 10, customizations: null },

      // --- Rest 6: Dosa Plaza ---
      { id: "d6-1", restaurantId: "rest-6", categoryId: "cat-17", name: "Masala Dosa", description: "Spiced potato filling", imageUrl: "https://images.unsplash.com/photo-1743517894265-c86ab035adef?q=80&w=1082&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "120", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 350, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d6-2", restaurantId: "rest-6", categoryId: "cat-18", name: "Idli Sambar", description: "Soft rice cakes", imageUrl: "https://i0.wp.com/www.chitrasfoodbook.com/wp-content/uploads/2022/02/bamboo-rice-idli-dosa-recipe-moongil-1248117199.jpeg?ssl=1", price: "80", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 280, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "2 pcs", preparationTime: 5, customizations: null },
      { id: "d6-3", restaurantId: "rest-6", categoryId: "cat-17", name: "Rava Dosa", description: "Semolina crepe", imageUrl: "https://rakskitchen.net/wp-content/uploads/2016/03/Rava-dosai-recipe-500x500.jpg", price: "140", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 150, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 15, customizations: null },
      { id: "d6-4", restaurantId: "rest-6", categoryId: "cat-19", name: "Onion Uttapam", description: "Thick pancake", imageUrl: "https://rakskitchen.net/wp-content/uploads/2013/03/8527219504_0ddb2cde6f_z-500x500.jpg", price: "150", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 120, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 15, customizations: null },
      { id: "d6-5", restaurantId: "rest-6", categoryId: "cat-18", name: "Medu Vada", description: "Crispy lentil donuts", imageUrl: "https://maayeka.com/wp-content/uploads/2018/10/vrat-ka-medu-vada-2-2.jpg", price: "90", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "2 pcs", preparationTime: 10, customizations: null },
      { id: "d6-6", restaurantId: "rest-6", categoryId: "cat-17", name: "Mysore Masala", description: "Spicy red chutney", imageUrl: "https://images.unsplash.com/photo-1708146464361-5c5ce4f9abb6?q=80&w=697&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "160", isVeg: true, isAvailable: true, rating: "4.9", reviewCount: 300, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 2, portionSize: "1 pc", preparationTime: 15, customizations: null },
      { id: "d6-7", restaurantId: "rest-6", categoryId: "cat-19", name: "Tomato Uttapam", description: "Tangy topping", imageUrl: "https://cdn.tarladalal.com/media/onion-tomato-uttapam-recipe.webp", price: "150", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 15, customizations: null },
      { id: "d6-8", restaurantId: "rest-6", categoryId: "cat-17", name: "Paper Dosa", description: "Super thin crispy", imageUrl: "https://static.toiimg.com/thumb/53239433.cms?imgsize=247810&width=800&height=800", price: "180", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 110, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Huge", preparationTime: 10, customizations: null },
      { id: "d6-9", restaurantId: "rest-6", categoryId: "cat-18", name: "Sambar Dip", description: "Extra bowl", imageUrl: "https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/sambar-recipe.jpg", price: "40", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 50, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Bowl", preparationTime: 0, customizations: null },
      { id: "d6-10", restaurantId: "rest-6", categoryId: "cat-17", name: "Cheese Dosa", description: "Kid favorite", imageUrl: "https://c.ndtvimg.com/gws/ms/try-this-delicious-chilli-cheese-dosa/assets/5.jpeg?1737004479", price: "180", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 140, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "1 pc", preparationTime: 10, customizations: null },

      // --- Rest 7: Royal Biryani House ---
      { id: "d7-1", restaurantId: "rest-7", categoryId: "cat-20", name: "Chicken Hyderabadi", description: "Authentic dum", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", price: "299", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 500, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 3, portionSize: "Serves 1", preparationTime: 25, customizations: null },
      { id: "d7-2", restaurantId: "rest-7", categoryId: "cat-20", name: "Mutton Hyderabadi", description: "Tender meat", imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80", price: "399", isVeg: false, isAvailable: true, rating: "4.9", reviewCount: 400, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 3, portionSize: "Serves 1", preparationTime: 30, customizations: null },
      { id: "d7-3", restaurantId: "rest-7", categoryId: "cat-22", name: "Chicken Tikka", description: "Smoky boneless", imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", price: "280", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 200, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "8 pcs", preparationTime: 20, customizations: null },
      { id: "d7-4", restaurantId: "rest-7", categoryId: "cat-21", name: "Lucknowi Veg", description: "Subtle flavors", imageUrl: "https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400&q=80", price: "249", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 150, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Serves 1", preparationTime: 25, customizations: null },
      { id: "d7-5", restaurantId: "rest-7", categoryId: "cat-22", name: "Seekh Kebab", description: "Minced mutton", imageUrl: "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=400&q=80", price: "320", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "4 pcs", preparationTime: 20, customizations: null },
      { id: "d7-6", restaurantId: "rest-7", categoryId: "cat-20", name: "Egg Biryani", description: "Spiced eggs", imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80", price: "249", isVeg: false, isAvailable: true, rating: "4.4", reviewCount: 120, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Serves 1", preparationTime: 20, customizations: null },
      { id: "d7-7", restaurantId: "rest-7", categoryId: "cat-22", name: "Paneer Tikka", description: "Veg starter", imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80", price: "260", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 140, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "8 pcs", preparationTime: 15, customizations: null },
      { id: "d7-8", restaurantId: "rest-7", categoryId: "cat-21", name: "Chicken Lucknowi", description: "Rich aroma", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", price: "319", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 160, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Serves 1", preparationTime: 30, customizations: null },
      { id: "d7-9", restaurantId: "rest-7", categoryId: "cat-22", name: "Tandoori Chicken", description: "Whole leg", imageUrl: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80", price: "299", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 220, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "2 pcs", preparationTime: 25, customizations: null },
      { id: "d7-10", restaurantId: "rest-7", categoryId: "cat-20", name: "Family Pack", description: "Chicken (Serves 4)", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80", price: "999", isVeg: false, isAvailable: true, rating: "4.9", reviewCount: 100, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Family", preparationTime: 40, customizations: null },

      // --- Rest 8: Sweet Cravings ---
      { id: "d8-1", restaurantId: "rest-8", categoryId: "cat-23", name: "Chocolate Truffle", description: "Dark chocolate", imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80", price: "150", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Slice", preparationTime: 0, customizations: null },
      { id: "d8-2", restaurantId: "rest-8", categoryId: "cat-23", name: "Red Velvet", description: "Cream cheese", imageUrl: "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=400&q=80", price: "160", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Slice", preparationTime: 0, customizations: null },
      { id: "d8-3", restaurantId: "rest-8", categoryId: "cat-24", name: "Vanilla Scoop", description: "Classic bean", imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80", price: "80", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 100, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Scoop", preparationTime: 0, customizations: null },
      { id: "d8-4", restaurantId: "rest-8", categoryId: "cat-24", name: "Belgian Chocolate", description: "Rich cocoa", imageUrl: "https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=400&q=80", price: "110", isVeg: true, isAvailable: true, rating: "4.9", reviewCount: 220, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 0, portionSize: "Scoop", preparationTime: 0, customizations: null },
      { id: "d8-5", restaurantId: "rest-8", categoryId: "cat-25", name: "Oreo Shake", description: "Crunchy sip", imageUrl: "https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "149", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 150, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d8-6", restaurantId: "rest-8", categoryId: "cat-25", name: "Strawberry Shake", description: "Fresh fruit", imageUrl: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80", price: "139", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },
      { id: "d8-7", restaurantId: "rest-8", categoryId: "cat-23", name: "Cheesecake", description: "Blueberry topping", imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80", price: "199", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 0, portionSize: "Slice", preparationTime: 0, customizations: null },
      { id: "d8-8", restaurantId: "rest-8", categoryId: "cat-24", name: "Mango Sorbet", description: "Dairy free", imageUrl: "https://images.unsplash.com/photo-1663904458920-f153c162fa79?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "99", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 70, isBestseller: false, isNew: true, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "Scoop", preparationTime: 0, customizations: null },
      { id: "d8-9", restaurantId: "rest-8", categoryId: "cat-23", name: "Brownie", description: "Walnut fudge", imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80", price: "90", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Pc", preparationTime: 5, customizations: null },
      { id: "d8-10", restaurantId: "rest-8", categoryId: "cat-25", name: "Cold Coffee", description: "With ice cream", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80", price: "120", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 130, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Glass", preparationTime: 5, customizations: null },

      // --- Rest 9: Pasta La Vista (Italian) ---
      { id: "d9-1", restaurantId: "rest-9", categoryId: "cat-26", name: "Arrabbiata", description: "Spicy red sauce", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "250", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 100, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d9-2", restaurantId: "rest-9", categoryId: "cat-26", name: "Alfredo", description: "Creamy white sauce", imageUrl: "https://images.unsplash.com/photo-1693609929783-f6a1cfd35b41?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "280", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 150, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d9-3", restaurantId: "rest-9", categoryId: "cat-27", name: "Veg Lasagna", description: "Layered cheese", imageUrl: "https://plus.unsplash.com/premium_photo-1671559021019-0268c54511b8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "320", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Portion", preparationTime: 25, customizations: null },
      { id: "d9-4", restaurantId: "rest-9", categoryId: "cat-28", name: "Bruschetta", description: "Tomato basil toast", imageUrl: "https://images.unsplash.com/photo-1506280754576-f6fa8a873550?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "180", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "4 pcs", preparationTime: 10, customizations: null },
      { id: "d9-5", restaurantId: "rest-9", categoryId: "cat-26", name: "Pesto Pasta", description: "Basil sauce", imageUrl: "https://images.unsplash.com/photo-1567608285969-48e4bbe0d399?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "290", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 70, isBestseller: false, isNew: true, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Regular", preparationTime: 15, customizations: null },
      { id: "d9-6", restaurantId: "rest-9", categoryId: "cat-27", name: "Chicken Lasagna", description: "Minced chicken", imageUrl: "https://images.unsplash.com/photo-1625555898028-3ddc4d85c9dc?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "360", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 110, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Portion", preparationTime: 25, customizations: null },
      { id: "d9-7", restaurantId: "rest-9", categoryId: "cat-26", name: "Carbonara", description: "Egg & bacon (pork)", imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80", price: "340", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 130, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 0, portionSize: "Regular", preparationTime: 20, customizations: null },
      { id: "d9-8", restaurantId: "rest-9", categoryId: "cat-28", name: "Garlic Bread", description: "Cheesy", imageUrl: "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "150", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 100, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "4 pcs", preparationTime: 10, customizations: null },
      { id: "d9-9", restaurantId: "rest-9", categoryId: "cat-26", name: "Mac N Cheese", description: "Classic comfort", imageUrl: "https://imagesvc.meredithcorp.io/v3/mm/image?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F43%2F2022%2F03%2F19%2F238691-Simple-Macaroni-And-Cheese-mfs_006.jpg&w=160&q=60&c=sc&poi=auto&orient=true&h=90", price: "260", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 140, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 0, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d9-10", restaurantId: "rest-9", categoryId: "cat-26", name: "Spaghetti Bolognese", description: "Meat sauce", imageUrl: "https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=400&q=80", price: "320", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 120, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Regular", preparationTime: 20, customizations: null },

      // --- Rest 10: Sushi Sensation (Japanese) ---
      { id: "d10-1", restaurantId: "rest-10", categoryId: "cat-29", name: "California Roll", description: "Crab & avocado", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80", price: "450", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "8 pcs", preparationTime: 15, customizations: null },
      { id: "d10-2", restaurantId: "rest-10", categoryId: "cat-29", name: "Veg Tempura Roll", description: "Crispy veg", imageUrl: "https://c.ndtvimg.com/2023-10/7h05mcqg_veg-tempura-roll_625x300_04_October_23.jpg", price: "350", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 150, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "8 pcs", preparationTime: 15, customizations: null },
      { id: "d10-3", restaurantId: "rest-10", categoryId: "cat-30", name: "Salmon Nigiri", description: "Fresh salmon", imageUrl: "https://izzycooking.com/wp-content/uploads/2020/10/Salmon-Nigiri-thumbnail.jpg", price: "500", isVeg: false, isAvailable: true, rating: "4.9", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 0, portionSize: "4 pcs", preparationTime: 15, customizations: null },
      { id: "d10-4", restaurantId: "rest-10", categoryId: "cat-31", name: "Tuna Sashimi", description: "Sliced raw tuna", imageUrl: "https://getfish.com.au/cdn/shop/articles/Step_3_-_Tuna_Sashimi.png?v=1717040042", price: "600", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 120, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 0, portionSize: "6 slices", preparationTime: 10, customizations: null },
      { id: "d10-5", restaurantId: "rest-10", categoryId: "cat-29", name: "Spicy Tuna Roll", description: "Tuna with chilli", imageUrl: "https://www.thespruceeats.com/thmb/7yMQzK9G7ogWdf4D0iAiukS52Vo=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/spicy-tuna-roll-2031509-hero-02-4c1809d4a2f74ea49013ee081a79543b.jpg", price: "480", isVeg: false, isAvailable: true, rating: "4.7", reviewCount: 140, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "8 pcs", preparationTime: 15, customizations: null },
      { id: "d10-6", restaurantId: "rest-10", categoryId: "cat-29", name: "Avocado Roll", description: "Creamy avocado", imageUrl: "https://www.sbfoods-worldwide.com/recipes/q78eit00000004lp-img/5_Dragonroll_Wasabi_ichiran.jpg", price: "320", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 100, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "8 pcs", preparationTime: 15, customizations: null },
      { id: "d10-7", restaurantId: "rest-10", categoryId: "cat-30", name: "Ebi Nigiri", description: "Shrimp", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQNxlty9Tagd1twKXhg2pLDKPqcDnzMF7Gzzw&s", price: "450", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "4 pcs", preparationTime: 15, customizations: null },
      { id: "d10-8", restaurantId: "rest-10", categoryId: "cat-29", name: "Dragon Roll", description: "Unagi & Avocado", imageUrl: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&q=80", price: "550", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 110, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 1, portionSize: "8 pcs", preparationTime: 20, customizations: null },
      { id: "d10-9", restaurantId: "rest-10", categoryId: "cat-31", name: "Salmon Sashimi", description: "Raw salmon", imageUrl: "https://www.manusmenu.com/wp-content/uploads/2016/06/salmon-sashimi-served-with-ponzu-and-wasabi-500x500.webp", price: "580", isVeg: false, isAvailable: true, rating: "4.9", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: true, spiceLevel: 0, portionSize: "6 slices", preparationTime: 10, customizations: null },
      { id: "d10-10", restaurantId: "rest-10", categoryId: "cat-29", name: "Cucumber Roll", description: "Simple fresh", imageUrl: "https://images.squarespace-cdn.com/content/v1/568e8fe6b204d5cbecd5c77e/02ae8fee-8b6f-407a-851f-737a439ab4e9/Cucumber+Sushi-0905.jpg", price: "280", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 0, portionSize: "8 pcs", preparationTime: 15, customizations: null },

      // --- Rest 11: Taco Town (Mexican) ---
      { id: "d11-1", restaurantId: "rest-11", categoryId: "cat-32", name: "Chicken Taco", description: "Grilled chicken", imageUrl: "https://images.unsplash.com/photo-1570461226513-e08b58a52c53?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "120", isVeg: false, isAvailable: true, rating: "4.5", reviewCount: 150, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d11-2", restaurantId: "rest-11", categoryId: "cat-32", name: "Veggie Taco", description: "Beans & cheese", imageUrl: "https://www.connoisseurusveg.com/wp-content/uploads/2025/02/veggie-tacos-sq-2.jpg", price: "100", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 120, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d11-3", restaurantId: "rest-11", categoryId: "cat-33", name: "Chicken Burrito", description: "Rice & beans", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80", price: "220", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Large", preparationTime: 15, customizations: null },
      { id: "d11-4", restaurantId: "rest-11", categoryId: "cat-33", name: "Veg Burrito", description: "Guacamole", imageUrl: "https://i0.wp.com/smittenkitchen.com/wp-content/uploads/2023/03/vegetable-burrito-10-scaled.jpg?fit=1200%2C800&ssl=1", price: "190", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 140, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Large", preparationTime: 15, customizations: null },
      { id: "d11-5", restaurantId: "rest-11", categoryId: "cat-34", name: "Loaded Nachos", description: "Cheese sauce", imageUrl: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80", price: "180", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d11-6", restaurantId: "rest-11", categoryId: "cat-32", name: "Fish Taco", description: "Crispy fish", imageUrl: "https://images.unsplash.com/photo-1703623339850-5793bfa23d80?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", price: "150", isVeg: false, isAvailable: true, rating: "4.6", reviewCount: 90, isBestseller: false, isNew: true, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "1 pc", preparationTime: 12, customizations: null },
      { id: "d11-7", restaurantId: "rest-11", categoryId: "cat-34", name: "Chicken Nachos", description: "Meat toppings", imageUrl: "https://cdn.foodfanatic.com/uploads/2014/10/shredded-chicken-nachos-for-two-picture-678x1024.jpg", price: "220", isVeg: false, isAvailable: true, rating: "4.8", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Bowl", preparationTime: 10, customizations: null },
      { id: "d11-8", restaurantId: "rest-11", categoryId: "cat-32", name: "Mushroom Taco", description: "Grilled mushroom", imageUrl: "https://tastesbetterfromscratch.com/wp-content/uploads/2023/06/MushroomTacos23-1.jpg", price: "110", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 80, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "1 pc", preparationTime: 10, customizations: null },
      { id: "d11-9", restaurantId: "rest-11", categoryId: "cat-34", name: "Salsa Dip", description: "Extra spicy", imageUrl: "https://www.noracooks.com/wp-content/uploads/2023/05/salsa-recipe-5.jpg", price: "50", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 60, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 3, portionSize: "Cup", preparationTime: 0, customizations: null },

      // --- Rest 12: Curry House (North Indian) ---
      { id: "d12-1", restaurantId: "rest-12", categoryId: "cat-35", name: "Paneer Butter Masala", description: "Creamy rich", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80", price: "240", isVeg: true, isAvailable: true, rating: "4.7", reviewCount: 200, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Bowl", preparationTime: 20, customizations: null },
      { id: "d12-2", restaurantId: "rest-12", categoryId: "cat-35", name: "Palak Paneer", description: "Spinach gravy", imageUrl: "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=400&q=80", price: "220", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 150, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 1, portionSize: "Bowl", preparationTime: 20, customizations: null },
      { id: "d12-3", restaurantId: "rest-12", categoryId: "cat-36", name: "Aloo Gobi", description: "Dry potato cauliflower", imageUrl: "https://www.indianhealthyrecipes.com/wp-content/uploads/2022/03/aloo-gobi-recipe.jpg", price: "180", isVeg: true, isAvailable: true, rating: "4.3", reviewCount: 100, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d12-4", restaurantId: "rest-12", categoryId: "cat-37", name: "Dal Tadka", description: "Tempered lentils", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMOxcIvnd56qR4vzvOcUGlJSEbA8w54D1R-Q&s", price: "190", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 180, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 15, customizations: null },
      { id: "d12-5", restaurantId: "rest-12", categoryId: "cat-35", name: "Kadai Paneer", description: "Spicy peppers", imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80", price: "250", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 140, isBestseller: false, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 3, portionSize: "Bowl", preparationTime: 20, customizations: null },
      { id: "d12-6", restaurantId: "rest-12", categoryId: "cat-36", name: "Malai Kofta", description: "Dumplings in gravy", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQj6QaRPYitZQ2v20z7RzJnSYJTFgxTpVcHgQ&s", price: "260", isVeg: true, isAvailable: true, rating: "4.8", reviewCount: 160, isBestseller: true, isNew: false, isChefSpecial: true, isHealthy: false, spiceLevel: 1, portionSize: "Bowl", preparationTime: 25, customizations: null },
      { id: "d12-7", restaurantId: "rest-12", categoryId: "cat-37", name: "Dal Makhani", description: "Black lentils", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4GfJo92Nr_qva-lOrSWb1rVfTqhNNYcbrXQ&s", price: "240", isVeg: true, isAvailable: true, rating: "4.9", reviewCount: 220, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 1, portionSize: "Bowl", preparationTime: 25, customizations: null },
      { id: "d12-8", restaurantId: "rest-12", categoryId: "cat-36", name: "Mixed Veg", description: "Seasoned veggies", imageUrl: "https://shwetainthekitchen.com/wp-content/uploads/2023/03/mixed-vegetable-curry.jpg", price: "200", isVeg: true, isAvailable: true, rating: "4.4", reviewCount: 90, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 20, customizations: null },
      { id: "d12-9", restaurantId: "rest-12", categoryId: "cat-35", name: "Matar Paneer", description: "Peas & cottage cheese", imageUrl: "https://www.cubesnjuliennes.com/wp-content/uploads/2020/02/Matar-Paneer-500x500.jpg", price: "230", isVeg: true, isAvailable: true, rating: "4.5", reviewCount: 110, isBestseller: false, isNew: false, isChefSpecial: false, isHealthy: false, spiceLevel: 2, portionSize: "Bowl", preparationTime: 20, customizations: null },
      { id: "d12-10", restaurantId: "rest-12", categoryId: "cat-36", name: "Chana Masala", description: "Spiced chickpeas", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmpJsKPEWvnOC_WdRAKi7J-Q8jG2j0c4wIMg&s", price: "190", isVeg: true, isAvailable: true, rating: "4.6", reviewCount: 130, isBestseller: true, isNew: false, isChefSpecial: false, isHealthy: true, spiceLevel: 2, portionSize: "Bowl", preparationTime: 15, customizations: null },
    ];

    dishes.forEach((d) => this.dishes.set(d.id, d));
  }

// --- DATA ACCESS METHODS ---
async getUser(id: string) { return this.users.get(id); }
async getUserByEmail(email: string) { return Array.from(this.users.values()).find((u) => u.email === email); }
async getUserByFirebaseUid(uid: string) { return Array.from(this.users.values()).find((u) => u.firebaseUid === uid); }
async createUser(user: Partial<InsertUser> & { email: string; name: string }) { const id = randomUUID(); const newUser = { ...user, id, phone: user.phone ?? null, role: user.role ?? "customer", avatarUrl: user.avatarUrl ?? null, firebaseUid: user.firebaseUid ?? null }; this.users.set(id, newUser); return newUser; }
async updateUser(id: string, data: Partial<User>) { const user = this.users.get(id); if (!user) return undefined; const updated = { ...user, ...data }; this.users.set(id, updated); return updated; }
async getRestaurants() { return Array.from(this.restaurants.values()); }
async getRestaurant(id: string) { return this.restaurants.get(id); }
async getRestaurantByOwner(ownerId: string) { return Array.from(this.restaurants.values()).find((r) => r.ownerId === ownerId); }
async createRestaurant(restaurant: InsertRestaurant) { const id = randomUUID(); const newRest = { ...restaurant, id } as Restaurant; this.restaurants.set(id, newRest); return newRest; }
async updateRestaurant(id: string, data: Partial<Restaurant>) { const r = this.restaurants.get(id); if (!r) return undefined; const updated = { ...r, ...data }; this.restaurants.set(id, updated); return updated; }
async getMenuCategories(restaurantId: string) { return Array.from(this.menuCategories.values()).filter((c) => c.restaurantId === restaurantId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)); }
async createMenuCategory(category: InsertMenuCategory) { const id = randomUUID(); const newCat = { ...category, id } as MenuCategory; this.menuCategories.set(id, newCat); return newCat; }
async getDishes(restaurantId: string) { return Array.from(this.dishes.values()).filter((d) => d.restaurantId === restaurantId); }
async getDish(id: string) { return this.dishes.get(id); }
async createDish(dish: InsertDish) { const id = randomUUID(); const newDish = { ...dish, id } as Dish; this.dishes.set(id, newDish); return newDish; }
async updateDish(id: string, data: Partial<Dish>) { const d = this.dishes.get(id); if (!d) return undefined; const updated = { ...d, ...data }; this.dishes.set(id, updated); return updated; }

async getOrders(userId: string) { 
  const userOrders = Array.from(this.orders.values()).filter((o) => o.userId === userId);
  return userOrders.map(o => this.simulateOrderProgress(o)).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}
async getOrder(id: string) { 
  const order = this.orders.get(id); 
  if (!order) return undefined;
  return this.simulateOrderProgress(order);
}
async getOrdersByRestaurant(restaurantId: string) { return Array.from(this.orders.values()).filter((o) => o.restaurantId === restaurantId).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); }
async getAvailableOrdersForDelivery() { return Array.from(this.orders.values()).filter((o) => o.status === "ready" && !o.deliveryPartnerId); }
async createOrder(order: InsertOrder) { const id = randomUUID(); const newOrder = { ...order, id, createdAt: new Date() } as Order; this.orders.set(id, newOrder); return newOrder; }
async updateOrder(id: string, data: Partial<Order>) { const o = this.orders.get(id); if (!o) return undefined; const updated = { ...o, ...data }; if (data.status) { if (data.status === 'accepted') updated.acceptedAt = new Date(); if (data.status === 'preparing') updated.preparingAt = new Date(); if (data.status === 'ready') updated.readyAt = new Date(); if (data.status === 'picked_up') updated.pickedUpAt = new Date(); if (data.status === 'delivered') updated.deliveredAt = new Date(); } this.orders.set(id, updated); return updated; }
async deleteOrder(id: string) { this.orders.delete(id); }

async getAddresses(userId: string) { return Array.from(this.addresses.values()).filter((a) => a.userId === userId); }
async getAddress(id: string) { return this.addresses.get(id); }
async createAddress(address: InsertAddress) { const id = randomUUID(); const newAddr = { ...address, id } as Address; this.addresses.set(id, newAddr); return newAddr; }
async deleteAddress(id: string) { this.addresses.delete(id); }

async getDeliveryPartner(userId: string) { return Array.from(this.deliveryPartners.values()).find((p) => p.userId === userId); }
async createDeliveryPartner(partner: InsertDeliveryPartner) { const id = randomUUID(); const newP = { ...partner, id } as DeliveryPartner; this.deliveryPartners.set(id, newP); return newP; }
async updateDeliveryPartner(userId: string, data: Partial<DeliveryPartner>) { const p = await this.getDeliveryPartner(userId); if (!p) return undefined; const updated = { ...p, ...data }; this.deliveryPartners.set(p.id, updated); return updated; }

async getCoupon(code: string) { return this.coupons.get(code.toUpperCase()); }
async validateCoupon(code: string, amount: number, restaurantId?: string) { const c = await this.getCoupon(code); if (!c || !c.isActive) return null; if (c.minOrderAmount && amount < Number(c.minOrderAmount)) return null; if (c.restaurantId && c.restaurantId !== restaurantId) return null; if (c.usageLimit && c.usedCount && c.usedCount >= c.usageLimit) return null; if (c.validUntil && new Date() > new Date(c.validUntil)) return null; return c; }

// --- REVIEWS ---
async createDishReview(review: InsertDishReview) { 
    const id = randomUUID(); 
    const newReview = { ...review, id, createdAt: new Date() } as DishReview; 
    this.dishReviews.set(id, newReview); 
    this.saveReviews(); // PERSIST TO FILE
    return newReview; 
}

async getDishReviews(dishId: string) { 
    return Array.from(this.dishReviews.values())
      .filter((r) => r.dishId === dishId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); 
}

// FIXED: Filters reviews by restaurant ID via its dishes
async getReviewsByRestaurant(restaurantId: string) {
    const dishes = await this.getDishes(restaurantId);
    const dishIds = dishes.map(d => d.id);
    
    return Array.from(this.dishReviews.values())
      .filter((r) => dishIds.includes(r.dishId))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}
}

const globalForStorage = globalThis as unknown as { storage: MemStorage };
export const storage = globalForStorage.storage || new MemStorage();
if (process.env.NODE_ENV !== "production") globalForStorage.storage = storage;