
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Brain, 
  Send,
  User,
  Bot,
  Lightbulb,
  TrendingUp,
  PiggyBank,
  AlertTriangle
} from "lucide-react";

interface ChatWithAIProps {
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ChatWithAI = ({ onClose }: ChatWithAIProps) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Olá! Sou a IA Moneva, seu consultor financeiro pessoal. Como posso ajudar você hoje? Posso analisar seus gastos, sugerir investimentos, criar planos de economia ou responder dúvidas sobre finanças.',
      timestamp: new Date()
    }
  ]);

  const quickQuestions = [
    { id: 1, text: "Como economizar R$ 500/mês?", icon: PiggyBank },
    { id: 2, text: "Onde investir R$ 10.000?", icon: TrendingUp },
    { id: 3, text: "Como quitar dívidas rápido?", icon: AlertTriangle },
    { id: 4, text: "Planejamento para aposentadoria", icon: Lightbulb }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: getAIResponse(message),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('economizar')) {
      return 'Para economizar R$ 500/mês, sugiro: 1) Revisar assinaturas (streaming, academia) - economia de ~R$ 100; 2) Cozinhar mais em casa vs delivery - economia de ~R$ 200; 3) Usar transporte público 2x/semana - economia de ~R$ 80; 4) Comprar no atacado - economia de ~R$ 120. Total: R$ 500! Quer que eu crie um plano detalhado?';
    }
    
    if (lowerMessage.includes('investir')) {
      return 'Para R$ 10.000, considerando seu perfil de risco moderado, sugiro: 50% em CDB (liquidez + segurança), 30% em fundos de renda fixa, 20% em ações via ETFs. Rendimento esperado: 12-15% ao ano. Prefere algo mais conservador ou está disposto a mais risco?';
    }
    
    if (lowerMessage.includes('dívida')) {
      return 'Para quitar dívidas rapidamente: 1) Liste todas por taxa de juros; 2) Quite primeiro as de maior juros; 3) Negocie desconto à vista se possível; 4) Considere portabilidade para juros menores; 5) Use método bola de neve para motivação. Precisa de ajuda para organizar suas dívidas específicas?';
    }
    
    return 'Entendi sua pergunta! Baseado no seu histórico financeiro, posso criar uma estratégia personalizada. Para dar conselhos mais precisos, você poderia me contar mais sobre sua situação atual? Por exemplo, sua renda mensal e principais gastos?';
  };

  const handleQuickQuestion = (questionText: string) => {
    setMessage(questionText);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">IA Moneva</h1>
              <p className="text-purple-100 text-sm">Online • Consultoria financeira</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 bg-white border-b">
        <p className="text-sm text-gray-600 mb-3">Perguntas rápidas:</p>
        <div className="flex gap-2 overflow-x-auto">
          {quickQuestions.map((question) => {
            const IconComponent = question.icon;
            return (
              <button
                key={question.id}
                onClick={() => handleQuickQuestion(question.text)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
              >
                <IconComponent className="h-4 w-4" />
                {question.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'ai' && (
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-purple-600" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-monevo-blue text-white rounded-br-sm'
                  : 'bg-white border rounded-bl-sm shadow-sm'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {msg.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            {msg.type === 'user' && (
              <div className="w-8 h-8 bg-monevo-blue rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua pergunta sobre finanças..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-monevo-blue hover:bg-monevo-darkBlue"
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWithAI;
