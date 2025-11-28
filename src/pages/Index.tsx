import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Sparkles, Zap, MessageCircle, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a Python script for data analysis",
    "What are the latest trends in AI?",
    "Help me brainstorm startup ideas",
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    if (isHeroVisible) {
      setIsHeroVisible(false);
    }

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        role: "assistant",
        content: "I'm a demo AI assistant. In a real implementation, I would connect to an AI service to provide intelligent responses. For now, I'm here to showcase the beautiful UI!",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-blob-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-[120px] animate-blob-2" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-float" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-glass border-b border-glass">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              NexusAI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-foreground hover:text-primary transition-colors">
              Features
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Button>
            <Button className="bg-primary hover:bg-primary-glow text-primary-foreground">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {isHeroVisible && (
          <div className="max-w-4xl mx-auto mb-8 animate-fade-in">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass backdrop-blur-glass border border-glass">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Powered by Advanced AI</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Your AI Companion
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Ask anything. Create anything. Learn anything. Your intelligent assistant is ready to help.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="group bg-glass backdrop-blur-glass border border-glass rounded-xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground">Get instant responses powered by cutting-edge AI technology</p>
              </div>

              <div className="group bg-glass backdrop-blur-glass border border-glass rounded-xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="bg-secondary/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Smart & Intuitive</h3>
                <p className="text-muted-foreground">Understands context and provides relevant, helpful answers</p>
              </div>

              <div className="group bg-glass backdrop-blur-glass border border-glass rounded-xl p-6 hover:scale-105 hover:shadow-glow transition-all duration-300 cursor-pointer">
                <div className="bg-accent/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/30 transition-colors">
                  <MessageCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Always Learning</h3>
                <p className="text-muted-foreground">Continuously improving to serve you better every day</p>
              </div>
            </div>

            {/* Suggestion Cards */}
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground mb-4 text-center">Try asking:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-4 bg-glass backdrop-blur-glass border border-glass rounded-lg hover:border-primary hover:shadow-glow transition-all duration-300 text-foreground hover:scale-[1.02]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="max-w-3xl mx-auto mb-32 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-xl ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-glass backdrop-blur-glass border border-glass text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-glass border-t border-glass">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 mb-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 bg-input border-glass text-foreground placeholder:text-muted-foreground h-12 text-base"
              />
              <Button
                onClick={handleSend}
                className="bg-gradient-primary hover:opacity-90 text-white h-12 px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              NexusAI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
