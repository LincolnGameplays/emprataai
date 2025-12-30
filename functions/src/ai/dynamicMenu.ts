import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// API Key do OpenWeatherMap (colocar no .env)
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

interface WeatherData {
  temp: number;
  condition: "HOT" | "COLD" | "RAINY" | "NORMAL";
  description: string;
}

/**
 * Busca dados do clima para uma cidade
 */
async function getWeather(city: string): Promise<WeatherData> {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          q: city,
          appid: WEATHER_API_KEY,
          units: "metric",
          lang: "pt_br",
        },
      }
    );

    const temp = response.data.main.temp;
    const weatherId = response.data.weather[0].id;
    const description = response.data.weather[0].description;

    let condition: WeatherData["condition"] = "NORMAL";
    if (temp >= 28) condition = "HOT";
    else if (temp <= 18) condition = "COLD";
    if (weatherId >= 200 && weatherId < 600) condition = "RAINY"; // Chuva/tempestade

    return {temp, condition, description};
  } catch (error) {
    console.error("[WEATHER API ERROR]", error);
    return {temp: 25, condition: "NORMAL", description: "normal"};
  }
}

/**
 * Menu Dinâmico - Executa a cada hora
 */
export const dynamicMenuUpdate = onSchedule(
  {schedule: "every 1 hours", timeZone: "America/Sao_Paulo"},
  async () => {
    console.log("[DYNAMIC MENU] Iniciando atualização de rankings...");

    try {
      // Busca todos os restaurantes ativos
      const usersSnapshot = await db
        .collection("users")
        .where("hasMenu", "==", true)
        .get();

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const city = userData.address?.city || "São Paulo";

        // Busca clima da cidade do restaurante
        const weather = await getWeather(city);

        // Busca categorias e produtos do menu
        const menuRef = db.collection("users").doc(userId).collection("menu");
        const productsSnapshot = await menuRef.get();

        const batch = db.batch();

        for (const productDoc of productsSnapshot.docs) {
          const product = productDoc.data();
          let newRank = product.baseRank || 50;

          // Ajuste por clima
          const category = (product.category || "").toLowerCase();

          if (weather.condition === "HOT") {
            if (category.includes("bebida") || category.includes("sorvete") ||
                category.includes("gelado") || category.includes("salada")) {
              newRank += 30; // Sobe no ranking
            }
            if (category.includes("sopa") || category.includes("quente")) {
              newRank -= 20; // Desce no ranking
            }
          } else if (weather.condition === "COLD" || weather.condition === "RAINY") {
            if (category.includes("sopa") || category.includes("café") ||
                category.includes("chocolate") || category.includes("vinho")) {
              newRank += 30;
            }
            if (category.includes("sorvete") || category.includes("gelado")) {
              newRank -= 20;
            }
          }

          // Ajuste por dia da semana
          const dayOfWeek = new Date().getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) { // Fim de semana
            if (category.includes("pizza") || category.includes("hamburguer") ||
                category.includes("churrasco")) {
              newRank += 15;
            }
          }

          // Ajuste por horário
          const hour = new Date().getHours();
          if (hour >= 11 && hour <= 14) { // Almoço
            if (category.includes("prato") || category.includes("executivo")) {
              newRank += 20;
            }
          } else if (hour >= 18 && hour <= 22) { // Jantar
            if (category.includes("pizza") || category.includes("hamburguer")) {
              newRank += 15;
            }
          }

          // Verifica validade (se houver campo expiresAt)
          if (product.expiresAt) {
            const expiresDate = product.expiresAt.toDate();
            const daysUntilExpiry = (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

            if (daysUntilExpiry <= 2 && daysUntilExpiry > 0) {
              // Cria promoção automática
              newRank += 50;
              batch.update(productDoc.ref, {
                autoPromo: true,
                autoPromoDiscount: 20, // 20% de desconto
                promoReason: "Oferta Relâmpago",
              });
            }
          }

          // Limita rank entre 0 e 100
          newRank = Math.max(0, Math.min(100, newRank));

          batch.update(productDoc.ref, {
            dynamicRank: newRank,
            lastRankUpdate: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // Atualiza status do clima no restaurante
        batch.update(userDoc.ref, {
          "menuContext.weather": weather,
          "menuContext.lastUpdate": admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();
        console.log(`[DYNAMIC MENU] Restaurante ${userId} atualizado. Clima: ${weather.condition}`);
      }

      console.log("[DYNAMIC MENU] Atualização concluída!");
    } catch (error) {
      console.error("[DYNAMIC MENU ERROR]", error);
    }
  }
);

/**
 * Sugere upsell baseado no pedido atual
 */
export const getUpsellSuggestions = onCall(async (request) => {
  const {restaurantId, currentItems} = request.data as {
    restaurantId: string;
    currentItems: string[];
  };

  if (!restaurantId) throw new HttpsError("invalid-argument", "Restaurant ID obrigatório");

  try {
    // Busca histórico de pedidos para encontrar padrões
    const ordersSnapshot = await db
      .collection("orders")
      .where("restaurantId", "==", restaurantId)
      .where("status", "==", "DELIVERED")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    // Conta co-ocorrências de produtos
    const coOccurrences: Record<string, Record<string, number>> = {};

    ordersSnapshot.forEach((doc) => {
      const items = doc.data().items || [];
      const itemIds = items.map((i: {productId: string}) => i.productId);

      itemIds.forEach((itemA: string) => {
        if (!coOccurrences[itemA]) coOccurrences[itemA] = {};
        itemIds.forEach((itemB: string) => {
          if (itemA !== itemB) {
            coOccurrences[itemA][itemB] = (coOccurrences[itemA][itemB] || 0) + 1;
          }
        });
      });
    });

    // Encontra sugestões para os itens atuais
    const suggestionScores: Record<string, number> = {};

    currentItems.forEach((itemId) => {
      if (coOccurrences[itemId]) {
        Object.entries(coOccurrences[itemId]).forEach(([suggId, count]) => {
          if (!currentItems.includes(suggId)) {
            suggestionScores[suggId] = (suggestionScores[suggId] || 0) + count;
          }
        });
      }
    });

    // Ordena por score e pega top 3
    const sortedSuggestions = Object.entries(suggestionScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => id);

    // Busca detalhes dos produtos sugeridos
    const menuRef = db.collection("users").doc(restaurantId).collection("menu");
    const suggestedProducts = await Promise.all(
      sortedSuggestions.map(async (prodId) => {
        const prodDoc = await menuRef.doc(prodId).get();
        if (prodDoc.exists) {
          return {id: prodId, ...prodDoc.data()};
        }
        return null;
      })
    );

    return {
      suggestions: suggestedProducts.filter(Boolean),
      message: "Quem pediu isso, geralmente adiciona:",
    };
  } catch (error) {
    console.error("[UPSELL ERROR]", error);
    throw new HttpsError("internal", "Erro ao buscar sugestões");
  }
});
