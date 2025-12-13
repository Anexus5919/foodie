"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { X, Send, Sparkles, Trash2, Bot, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hello! 👋 I'm your personal Foodie Assistant. Ask me about calories, diet recommendations, or find the best dishes near you!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage.content,
          history: messages 
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "Oops! I'm having trouble connecting to the kitchen. Please try again later. 🍳",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown parser
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
      const cleanLine = isBullet ? line.trim().substring(2) : line;
      
      if (!cleanLine.trim()) return <div key={i} className="h-2" />;

      const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);

      return (
        <div 
          key={i} 
          className={cn(
            "leading-relaxed mb-1", 
            isBullet && "pl-4 relative flex items-start"
          )}
        >
          {isBullet && (
             <span className="mr-2 mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
          )}
          <span>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
              } else if (part.startsWith("*") && part.endsWith("*")) {
                return <em key={j} className="italic opacity-90">{part.slice(1, -1)}</em>;
              }
              return <span key={j}>{part}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <>
      {/* Custom Style for the moving gradient animation */}
      <style jsx global>{`
        @keyframes gradient-pan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 3s ease infinite;
        }
      `}</style>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="origin-bottom-right"
            >
              <Card className="w-[360px] md:w-[420px] h-[600px] shadow-2xl border-0 flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
                {/* Header with Moving Gradient */}
                <CardHeader className="p-4 shrink-0 shadow-md relative z-10 animate-gradient-pan bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md border border-white/10">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold leading-tight">Foodie AI</CardTitle>
                        <p className="text-xs text-white/90 font-medium">Your Smart Dining Companion</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8 rounded-full transition-colors"
                        onClick={() => setMessages([messages[0]])}
                        title="Clear Chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 h-8 w-8 rounded-full transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Chat Area */}
                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-zinc-900/50">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-6">
                      {messages.map((msg) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={msg.id}
                          className={cn(
                            "flex gap-3 max-w-[85%]",
                            msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                          )}
                        >
                          {/* Avatar */}
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/20",
                            msg.role === "ai" 
                              ? "bg-gradient-to-br from-orange-600 to-amber-600 text-white" 
                              : "bg-gradient-to-br from-orange-400 to-amber-400 text-white"
                          )}>
                            {msg.role === "ai" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                          </div>

                          {/* Bubble */}
                          <div className="flex flex-col gap-1">
                            <div
                              className={cn(
                                "px-4 py-2.5 shadow-sm text-sm break-words",
                                msg.role === "user"
                                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-sm"
                                  : "bg-white dark:bg-zinc-800 text-foreground border border-gray-100 dark:border-zinc-700 rounded-2xl rounded-tl-sm"
                              )}
                            >
                              {renderContent(msg.content)}
                            </div>
                            <span className={cn(
                              "text-[10px] text-muted-foreground px-1",
                              msg.role === "user" && "text-right"
                            )}>
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {isLoading && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex gap-3 mr-auto max-w-[85%]"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-600 to-amber-600 text-white flex items-center justify-center shrink-0">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                            <span className="h-2 w-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="h-2 w-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="h-2 w-2 bg-orange-500 rounded-full animate-bounce"></span>
                          </div>
                        </motion.div>
                      )}
                      <div ref={scrollRef} className="h-2" />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 bg-background border-t">
                    <form
                      onSubmit={handleSend}
                      className="flex items-center gap-2 relative"
                    >
                      <Input
                        placeholder="Ask about food, diet, calories..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 rounded-full pl-5 pr-12 h-12 bg-muted/50 border-transparent focus-visible:border-orange-300 focus-visible:ring-0 focus-visible:bg-background transition-all"
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim() || isLoading}
                        className={cn(
                          "absolute right-1.5 h-9 w-9 rounded-full transition-all shadow-sm animate-gradient-pan",
                          input.trim() 
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-100"
                            : "bg-muted text-muted-foreground scale-90 opacity-0 pointer-events-none"
                        )}
                      >
                        <Send className="h-4 w-4 ml-0.5" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Launcher Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative group outline-none"
        >
          {/* Animated Glow Effect (Reduced Intensity) */}
          <div className="absolute inset-0 rounded-full blur-lg opacity-20 group-hover:opacity-50 transition-opacity duration-300 animate-gradient-pan bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
          
          <div className={cn(
            "relative h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 overflow-hidden border-[3px] border-white/20",
            isOpen 
              ? "bg-zinc-800 rotate-90" 
              : "animate-gradient-pan bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rotate-0"
          )}>
            {/* Inner Content */}
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <div className="relative h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-inner">
                 <div className="relative w-full h-full p-0.5">
                   <Image 
                     src="/logo.svg" 
                     alt="AI" 
                     fill 
                     className="object-contain" 
                   />
                 </div>
              </div>
            )}
          </div>
        </motion.button>
      </div>
    </>
  );
}