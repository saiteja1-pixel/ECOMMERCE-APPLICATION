import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        message: "⚠️ **Gemini API Key is not configured.** Please add `GEMINI_API_KEY=your_key` to your `frontend/.env.local` file and restart the server to activate the AI Chatbot.",
        status: "error"
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are a friendly, highly intelligent AI assistant for CommerceHub (an e-commerce platform).
Your goals:
1. Help users search for products using the search_products tool.
2. Help users check their order details and order history using the get_user_orders tool.
3. Help users calculate their total expenses (sum of order totals) using the calculate_user_expenses tool.

Guidelines:
- If the user asks about orders or expenses but is not logged in (e.g., if any of the tools return a 'User is not logged in' error), politely inform them they need to log in to access this information.
- Present product search results as clean lists or markdown tables with names, descriptions, prices, stock status, and formatting.
- Always display currency amounts in USD format (e.g., $19.99).
- Keep responses concise, professional, and friendly. Avoid excessive jargon.`,
    });

    // Format chat history for Gemini
    // Gemini history expects format { role: "user" | "model", parts: [{ text: string }] }
    // We map roles from frontend ('user' | 'bot' | 'system') to Gemini roles.
    const history: any[] = [];
    const chatHistory = messages.slice(0, -1);
    const latestMessage = messages[messages.length - 1];

    for (const msg of chatHistory) {
      // Map roles
      const role = msg.role === "user" ? "user" : "model";
      
      // If history is empty, it MUST start with 'user' for Gemini to process correctly
      if (history.length === 0 && role !== "user") {
        continue;
      }

      // Ensure alternating roles: if the last role is the same, merge the text
      if (history.length > 0 && history[history.length - 1].role === role) {
        history[history.length - 1].parts[0].text += "\n" + msg.content;
      } else {
        history.push({
          role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Setup tools
    const tools: any[] = [{
      functionDeclarations: [
        {
          name: "search_products",
          description: "Search for products in the store by name, description, or category.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              query: { type: SchemaType.STRING, description: "The keyword or terms to search for in products." },
            },
            required: ["query"],
          },
        },
        {
          name: "calculate_user_expenses",
          description: "Calculates the total expenses of the customer from all of their orders.",
          parameters: { type: SchemaType.OBJECT, properties: {} },
        },
        {
          name: "get_user_orders",
          description: "Fetches a list of the customer's orders and their statuses.",
          parameters: { type: SchemaType.OBJECT, properties: {} },
        },
      ],
    }];

    // Start chat session
    const chat = model.startChat({
      history,
      tools,
    });

    let result = await chat.sendMessage(latestMessage.content);

    // Check if Gemini requested a function call
    const functionCalls = result.response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let functionResult: any;

      if (call.name === "search_products") {
        const query = (call.args as { query: string }).query;
        functionResult = await executeSearchProducts(supabase, query);
      } else if (call.name === "calculate_user_expenses") {
        functionResult = await executeCalculateExpenses(supabase, user?.id);
      } else if (call.name === "get_user_orders") {
        functionResult = await executeGetUserOrders(supabase, user?.id);
      }

      // Send function response back to Gemini to get the final response text
      result = await chat.sendMessage([
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          functionResponse: {
            name: call.name,
            response: functionResult,
          },
        } as any,
      ]);
    }

    const responseText = result.response.text();
    return NextResponse.json({ message: responseText });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      message: `An error occurred while processing your request: ${error.message || "Unknown error"}.`,
      status: "error"
    }, { status: 500 });
  }
}

// Implement helper functions to query Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeSearchProducts(supabase: any, query: string) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, stock, image_url, status")
      .not("status", "eq", "deleted")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5);

    if (error) throw error;
    return { products: data || [] };
  } catch (err: any) {
    return { error: `Failed to search products: ${err.message}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeCalculateExpenses(supabase: any, userId?: string) {
  if (!userId) {
    return { error: "User is not logged in." };
  }
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("total, status, order_number, created_at")
      .eq("customer_id", userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { totalExpenses: 0, orderCount: 0, message: "You have not placed any orders yet." };
    }

    let totalSpent = 0;
    let activeSpent = 0; // Exclude cancelled orders
    let cancelledCount = 0;
    let activeCount = 0;

    for (const order of data) {
      const orderTotal = Number(order.total) || 0;
      totalSpent += orderTotal;
      if (order.status === "cancelled") {
        cancelledCount++;
      } else {
        activeSpent += orderTotal;
        activeCount++;
      }
    }

    return {
      totalExpenses: totalSpent,
      activeExpenses: activeSpent,
      orderCount: data.length,
      activeCount,
      cancelledCount,
    };
  } catch (err: any) {
    return { error: `Failed to calculate expenses: ${err.message}` };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeGetUserOrders(supabase: any, userId?: string) {
  if (!userId) {
    return { error: "User is not logged in." };
  }
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("order_number, total, status, created_at")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw error;
    return { orders: data || [] };
  } catch (err: any) {
    return { error: `Failed to retrieve orders: ${err.message}` };
  }
}
