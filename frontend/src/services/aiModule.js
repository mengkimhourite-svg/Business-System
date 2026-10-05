import { api } from "./api.js";

/**
 * AI Module API Service
 * Backend API integration for AI-powered features.
 * 
 * Endpoints:
 * - POST /api/ai/sales-prediction
 * - POST /api/ai/inventory-prediction
 * - POST /api/ai/customer-analysis
 * - POST /api/ai/recommendations
 * - POST /api/ai/anomaly-detection
 * - POST /api/ai/chatbot
 */

const AI_BASE_URL = "/api/ai";

/**
 * Sales Prediction API
 * Predicts future sales based on historical data
 * @param {Object} params - Prediction parameters
 * @param {string} params.period - Prediction period (7d, 30d, 90d)
 * @param {string} params.category - Optional category filter
 * @returns {Promise<Object>} Sales prediction data
 */
export async function salesPrediction(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/sales-prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        period: params.period || "30d",
        category: params.category || null,
        start_date: params.startDate || null,
        end_date: params.endDate || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Sales prediction error:", error);
    // Return mock data for development
    return getMockSalesPrediction(params);
  }
}

/**
 * Inventory Prediction API
 * Predicts inventory needs and stockout risks
 * @param {Object} params - Prediction parameters
 * @param {number} params.threshold - Stock threshold for alerts
 * @returns {Promise<Object>} Inventory prediction data
 */
export async function inventoryPrediction(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/inventory-prediction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        threshold: params.threshold || 10,
        category_id: params.categoryId || null,
        include_reorder: params.includeReorder || true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Inventory prediction error:", error);
    return getMockInventoryPrediction(params);
  }
}

/**
 * Customer Analysis API
 * Analyzes customer behavior and segmentation
 * @param {Object} params - Analysis parameters
 * @param {string} params.segment - Customer segment to analyze
 * @returns {Promise<Object>} Customer analysis data
 */
export async function customerAnalysis(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/customer-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        segment: params.segment || "all",
        period: params.period || "30d",
        include_churn: params.includeChurn || true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Customer analysis error:", error);
    return getMockCustomerAnalysis(params);
  }
}

/**
 * Recommendations API
 * Generates product and business recommendations
 * @param {Object} params - Recommendation parameters
 * @param {string} params.type - Recommendation type (products, cross-sell, upsell)
 * @returns {Promise<Object>} Recommendations data
 */
export async function recommendations(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: params.type || "products",
        limit: params.limit || 10,
        customer_id: params.customerId || null,
        product_id: params.productId || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Recommendations error:", error);
    return getMockRecommendations(params);
  }
}

/**
 * Anomaly Detection API
 * Detects unusual patterns in sales, inventory, or customer data
 * @param {Object} params - Detection parameters
 * @param {string} params.type - Anomaly type (sales, inventory, customer)
 * @returns {Promise<Object>} Anomaly detection results
 */
export async function anomalyDetection(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/anomaly-detection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        type: params.type || "sales",
        period: params.period || "30d",
        sensitivity: params.sensitivity || "medium",
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Anomaly detection error:", error);
    return getMockAnomalyDetection(params);
  }
}

/**
 * AI Chatbot API
 * Processes natural language queries about business data
 * @param {Object} params - Chat parameters
 * @param {string} params.message - User message
 * @param {string} params.context - Chat context
 * @returns {Promise<Object>} Chatbot response
 */
export async function chatbot(params = {}) {
  try {
    const response = await fetch(`${AI_BASE_URL}/chatbot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: params.message || "",
        context: {
          page: params.pageContext || null,
          language: params.language || "en",
        },
        history: params.history || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Chatbot error:", error);
    return getMockChatbotResponse(params);
  }
}

/* ------------------------------------------------------------------ */
/* Mock Data for Development                                          */
/* ------------------------------------------------------------------ */

function getMockSalesPrediction(params) {
  const days = params.period === "7d" ? 7 : params.period === "90d" ? 90 : 30;
  const predictions = [];
  const baseRevenue = 4500;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const variation = Math.random() * 0.3 - 0.15;
    predictions.push({
      date: date.toISOString().split("T")[0],
      predicted_revenue: Math.round(baseRevenue * (1 + variation)),
      predicted_orders: Math.round(32 * (1 + variation)),
      confidence: Math.round(85 + Math.random() * 10),
    });
  }

  return {
    success: true,
    data: {
      predictions,
      summary: {
        total_predicted_revenue: predictions.reduce((s, p) => s + p.predicted_revenue, 0),
        average_daily_revenue: Math.round(predictions.reduce((s, p) => s + p.predicted_revenue, 0) / days),
        trend: "up",
        confidence_score: Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / days),
      },
      insights: [
        "Revenue is expected to increase by 12% over the next period.",
        "Weekend sales typically show 25% higher volume.",
        "Consider increasing inventory for top-performing categories.",
      ],
    },
  };
}

function getMockInventoryPrediction(params) {
  return {
    success: true,
    data: {
      stockout_risk: [
        { product_id: 1, product_name: "Wireless Mouse", current_stock: 5, days_until_stockout: 3, risk_level: "high" },
        { product_id: 2, product_name: "USB Cable", current_stock: 12, days_until_stockout: 7, risk_level: "medium" },
        { product_id: 3, product_name: "Laptop Stand", current_stock: 3, days_until_stockout: 2, risk_level: "high" },
      ],
      reorder_suggestions: [
        { product_id: 1, product_name: "Wireless Mouse", suggested_quantity: 50, supplier: "Tech Supplies Co." },
        { product_id: 2, product_name: "USB Cable", suggested_quantity: 100, supplier: "Cable World" },
        { product_id: 3, product_name: "Laptop Stand", suggested_quantity: 25, supplier: "Office Plus" },
      ],
      summary: {
        total_products_at_risk: 3,
        estimated_stockout_cost: 2450,
        recommended_reorder_total: 175,
      },
    },
  };
}

function getMockCustomerAnalysis(params) {
  return {
    success: true,
    data: {
      segments: [
        { name: "High Value", count: 145, percentage: 15, avg_spent: 890, retention_rate: 92 },
        { name: "Regular", count: 420, percentage: 42, avg_spent: 320, retention_rate: 78 },
        { name: "Occasional", count: 280, percentage: 28, avg_spent: 120, retention_rate: 45 },
        { name: "At Risk", count: 155, percentage: 15, avg_spent: 250, retention_rate: 23 },
      ],
      churn_prediction: {
        at_risk_count: 45,
        predicted_churn_rate: 8.5,
        recommended_actions: [
          "Send personalized discount offers to at-risk customers",
          "Implement loyalty rewards program",
          "Follow up with customers inactive for 30+ days",
        ],
      },
      insights: [
        "15% of customers are at high risk of churning.",
        "High-value customers represent 15% of base but 45% of revenue.",
        "Average customer lifetime value is $580.",
      ],
    },
  };
}

function getMockRecommendations(params) {
  return {
    success: true,
    data: {
      products: [
        { id: 1, name: "MacBook Pro 14\"", score: 95, reason: "Based on your purchase history" },
        { id: 2, name: "iPhone 15 Pro", score: 92, reason: "Popular in your category" },
        { id: 3, name: "AirPods Pro", score: 88, reason: "Frequently bought together" },
        { id: 4, name: "iPad Air", score: 85, reason: "Similar customer preferences" },
        { id: 5, name: "Apple Watch", score: 82, reason: "Trending in your region" },
      ],
      cross_sell: [
        { product_id: 1, recommended: ["Laptop Case", "USB Hub", "Screen Protector"], conversion_rate: 23 },
        { product_id: 2, recommended: ["Phone Case", "Charger", "Screen Protector"], conversion_rate: 35 },
      ],
      summary: {
        total_recommendations: 15,
        estimated_uplift: "12-18%",
        confidence_score: 87,
      },
    },
  };
}

function getMockAnomalyDetection(params) {
  return {
    success: true,
    data: {
      anomalies: [
        {
          id: 1,
          type: "sales_spike",
          date: "2024-01-15",
          description: "Unusual sales spike detected (+45% above average)",
          severity: "info",
          possible_cause: "Promotional campaign or seasonal event",
        },
        {
          id: 2,
          type: "stock_anomaly",
          date: "2024-01-14",
          description: "Unexpected stock decrease for Wireless Mouse",
          severity: "warning",
          possible_cause: "Bulk order or inventory shrinkage",
        },
        {
          id: 3,
          type: "payment_anomaly",
          date: "2024-01-13",
          description: "Higher than usual refund rate detected",
          severity: "high",
          possible_cause: "Product quality issue or customer dissatisfaction",
        },
      ],
      summary: {
        total_anomalies: 3,
        high_severity: 1,
        medium_severity: 1,
        low_severity: 1,
        period_analyzed: "30d",
      },
      recommendations: [
        "Investigate the payment anomaly and review recent refunds.",
        "Monitor stock levels closely for the next 7 days.",
        "Document the sales spike for future forecasting.",
      ],
    },
  };
}

function getMockChatbotResponse(params) {
  const message = params.message.toLowerCase();
  
  let response = {
    success: true,
    data: {
      message: "",
      intent: "general",
      suggestions: [],
      data: null,
    },
  };

  if (message.includes("sales") || message.includes("revenue")) {
    response.data.message = "Your current sales performance looks strong! You've achieved $124,563 in revenue this month, which is a 12.5% increase compared to last month. Would you like me to provide a detailed breakdown?";
    response.data.intent = "sales";
    response.data.suggestions = ["Show sales by category", "Compare with last month", "Top selling products"];
    response.data.data = {
      revenue: 124563,
      change: 12.5,
      orders: 1845,
    };
  } else if (message.includes("stock") || message.includes("inventory")) {
    response.data.message = "You currently have 23 products with low stock levels. 5 of these are at critical levels and need immediate attention. Would you like me to generate a reorder report?";
    response.data.intent = "inventory";
    response.data.suggestions = ["View low stock items", "Generate reorder report", "Stock predictions"];
    response.data.data = {
      low_stock_count: 23,
      critical_count: 5,
    };
  } else if (message.includes("customer")) {
    response.data.message = "You have 5,678 total customers. Your top 10% of customers account for 45% of your revenue. There are 45 customers at risk of churning. Would you like me to analyze customer segments?";
    response.data.intent = "customer";
    response.data.suggestions = ["Customer segmentation", "At-risk customers", "Customer lifetime value"];
    response.data.data = {
      total_customers: 5678,
      at_risk: 45,
    };
  } else {
    response.data.message = "I'm your AI Business Assistant. I can help you with sales analysis, inventory management, customer insights, and business recommendations. What would you like to know?";
    response.data.intent = "general";
    response.data.suggestions = ["Sales performance", "Inventory status", "Customer analysis", "Business recommendations"];
  }

  return response;
}

export default {
  salesPrediction,
  inventoryPrediction,
  customerAnalysis,
  recommendations,
  anomalyDetection,
  chatbot,
};
