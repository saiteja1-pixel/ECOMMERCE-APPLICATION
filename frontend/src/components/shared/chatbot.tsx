"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Bot, Send, X, MessageCircle, Sparkles, Trash2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const pathname = usePathname();
  const { isAuthenticated, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Strictly only render the chatbot on customer panel pages to maintain clean public pages
  const isCustomerPage = pathname?.startsWith("/customer");

  // Load initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greetingName = profile?.full_name || "there";
      setMessages([
        {
          id: "welcome",
          role: "bot",
          content: `Hi ${greetingName}! 👋 I'm the CommerceHub AI assistant. How can I help you today?
          
You can ask me to:
- **Search for products** (e.g. "Find wireless headphones")
- **Track order statuses** (e.g. "Check my recent orders")
- **Calculate expenses** (e.g. "Calculate my total order spending")`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [profile, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isCustomerPage) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role === "user" ? "user" : "model",
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI");
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: Math.random().toString(),
        role: "bot",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "system",
          content: "❌ Sorry, I encountered an error. Please make sure the backend configuration is correct and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(text);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const greetingName = profile?.full_name || "there";
      setMessages([
        {
          id: "welcome-reset",
          role: "bot",
          content: `Hi ${greetingName}! 👋 I've cleared our chat history. What else can I help you with?`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Safe markdown-like syntax parser to display clean JSX
  const formatMessageText = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, index) => {
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const lineContent = isBullet ? line.trim().substring(2) : line;
      const parts = [];
      let currentText = lineContent;
      let keyIndex = 0;

      while (currentText.length > 0) {
        const boldIndex = currentText.indexOf("**");
        const codeIndex = currentText.indexOf("`");

        if (boldIndex === -1 && codeIndex === -1) {
          parts.push(currentText);
          break;
        }

        if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
          if (boldIndex > 0) {
            parts.push(currentText.substring(0, boldIndex));
          }
          const closingBoldIndex = currentText.indexOf("**", boldIndex + 2);
          if (closingBoldIndex !== -1) {
            const boldText = currentText.substring(boldIndex + 2, closingBoldIndex);
            parts.push(
              <strong key={`bold-${index}-${keyIndex++}`} className="font-bold text-foreground">
                {boldText}
              </strong>
            );
            currentText = currentText.substring(closingBoldIndex + 2);
          } else {
            parts.push(currentText.substring(boldIndex));
            break;
          }
        } else {
          if (codeIndex > 0) {
            parts.push(currentText.substring(0, codeIndex));
          }
          const closingCodeIndex = currentText.indexOf("`", codeIndex + 1);
          if (closingCodeIndex !== -1) {
            const codeText = currentText.substring(codeIndex + 1, closingCodeIndex);
            parts.push(
              <code key={`code-${index}-${keyIndex++}`} className="px-1.5 py-0.5 bg-muted-foreground/15 rounded text-xs font-mono">
                {codeText}
              </code>
            );
            currentText = currentText.substring(closingCodeIndex + 1);
          } else {
            parts.push(currentText.substring(codeIndex));
            break;
          }
        }
      }

      if (isBullet) {
        return (
          <li key={`line-${index}`} className="list-disc ml-5 mb-1">
            {parts}
          </li>
        );
      }

      return (
        <p key={`line-${index}`} className="mb-2 last:mb-0 leading-relaxed text-sm">
          {parts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center border border-primary/20 hover:shadow-xl hover:shadow-primary/20"
        title="Chat with AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] max-w-[calc(100vw-2rem)] bg-card text-card-foreground border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out transform scale-100 opacity-100 origin-bottom-right">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                  CommerceHub AI
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <span className="text-[11px] text-muted-foreground">Always active</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-destructive transition-colors duration-150"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Logs */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user"
                    ? "items-end"
                    : msg.role === "system"
                    ? "items-center"
                    : "items-start"
                }`}
              >
                {msg.role !== "system" && (
                  <span className="text-[10px] text-muted-foreground mb-1 px-1">
                    {msg.role === "user" ? "You" : "Assistant"} •{" "}
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm max-w-[85%]"
                      : msg.role === "system"
                      ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-center max-w-[90%]"
                      : "bg-card border border-border/60 text-card-foreground rounded-tl-none shadow-sm max-w-[85%]"
                  }`}
                >
                  {msg.role === "system" ? (
                    <p className="text-xs leading-relaxed font-medium">{msg.content}</p>
                  ) : (
                    <div>{formatMessageText(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-muted-foreground mb-1 px-1">Assistant • Typing...</span>
                <div className="bg-card border border-border/60 text-card-foreground px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 2 && !isLoading && (
            <div className="p-3 bg-muted/5 border-t border-border/40 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleSuggestionClick("Search for running shoes")}
                className="text-xs px-2.5 py-1.5 bg-card hover:bg-primary hover:text-primary-foreground border border-border/80 rounded-full cursor-pointer transition-all duration-150 flex items-center gap-1 shadow-sm font-medium"
              >
                <Sparkles className="h-3 w-3" />
                Find running shoes
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => handleSuggestionClick("Calculate my total order spending")}
                    className="text-xs px-2.5 py-1.5 bg-card hover:bg-primary hover:text-primary-foreground border border-border/80 rounded-full cursor-pointer transition-all duration-150 flex items-center gap-1 shadow-sm font-medium"
                  >
                    <Sparkles className="h-3 w-3" />
                    My total expenses
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Check my recent orders")}
                    className="text-xs px-2.5 py-1.5 bg-card hover:bg-primary hover:text-primary-foreground border border-border/80 rounded-full cursor-pointer transition-all duration-150 flex items-center gap-1 shadow-sm font-medium"
                  >
                    <Sparkles className="h-3 w-3" />
                    Track my orders
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-border/50 bg-card flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me something..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm bg-muted/30 border border-border/85 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-xl shadow hover:bg-primary/95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
