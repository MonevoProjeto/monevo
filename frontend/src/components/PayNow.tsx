
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Smartphone,
  QrCode
} from "lucide-react";

interface PayNowProps {
  onClose: () => void;
}

const PayNow = ({ onClose }: PayNowProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("debit");
  const [amount, setAmount] = useState<string>("1240.50");

  const billDetails = {
    card: "Cartão Nubank",
    dueDate: "Amanhã (31/03)",
    amount: "R$ 1.240,50",
    minimumAmount: "R$ 186,08",
    interest: "12,5% a.m.",
    barcode: "23793.39104 60000.123456 78901.234567 8 95760000124050"
  };

  const paymentMethods = [
    { id: "debit", label: "Cartão de Débito", icon: CreditCard, fee: "Grátis" },
    { id: "pix", label: "PIX", icon: QrCode, fee: "Grátis" },
    { id: "transfer", label: "TED/DOC", icon: Smartphone, fee: "R$ 2,50" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Pagar Fatura</h1>
            <p className="text-orange-100 text-sm">Pagamento Rápido e Seguro</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-yellow-300" />
            <span className="font-bold text-lg">Vence {billDetails.dueDate}</span>
          </div>
          <p className="text-orange-100 text-sm">
            {billDetails.card} - {billDetails.amount}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bill Details */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Detalhes da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Cartão</p>
                <p className="font-bold text-gray-900">{billDetails.card}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Vencimento</p>
                <p className="font-bold text-red-600">{billDetails.dueDate}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="font-bold text-gray-900">{billDetails.amount}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pagamento Mínimo</p>
                <p className="font-bold text-gray-600">{billDetails.minimumAmount}</p>
              </div>
            </div>
            
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Importante</span>
              </div>
              <p className="text-xs text-red-700">
                Juros de {billDetails.interest} sobre valor não pago. Pagar apenas o mínimo resultará em R$ 130 de juros.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Amount */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valor do Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={amount === "1240.50" ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount("1240.50")}
                className="flex-1"
              >
                Total
              </Button>
              <Button 
                variant={amount === "186.08" ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount("186.08")}
                className="flex-1"
              >
                Mínimo
              </Button>
              <Button 
                variant={!["1240.50", "186.08"].includes(amount) ? "default" : "outline"}
                size="sm"
                className="flex-1"
              >
                Outro
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1240.50"
                className="text-lg font-bold"
              />
            </div>

            {parseFloat(amount) < 1240.50 && (
              <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Pagamento parcial resultará em juros sobre o valor restante.
                  Economia ao pagar total: <strong>R$ 130</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <div 
                  key={method.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === method.id 
                      ? 'border-monevo-blue bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{method.label}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {method.fee}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-green-900 mb-1">Resumo do Pagamento</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-bold">R$ {amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa:</span>
                    <span className="font-bold">
                      {paymentMethods.find(m => m.id === paymentMethod)?.fee}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-2">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold">
                      R$ {paymentMethod === "transfer" ? (parseFloat(amount) + 2.50).toFixed(2) : amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Clock className="h-4 w-4 mr-2" />
              Pagar Agora
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Pagamento Seguro</h4>
                <p className="text-sm text-blue-700">
                  Suas informações estão protegidas com criptografia de ponta a ponta. 
                  O pagamento será processado instantaneamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayNow;
