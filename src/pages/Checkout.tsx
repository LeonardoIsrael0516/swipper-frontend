import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTracking } from '@/contexts/TrackingContext';
import { Loader2, CreditCard, QrCode, Lock, Check, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { formatCPF, formatPhone, formatCEP, validateCPF, validateCEP } from '@/lib/validation';
import { Plan } from '@/types/plan';

// Estados do Brasil para o select
const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// Função para retornar o ícone da bandeira usando os SVGs da pasta public
const getCardBrandIcon = (brand: string) => {
  const brandLower = brand.toLowerCase();
  let imagePath = '';
  
  switch (brandLower) {
    case 'visa':
      imagePath = '/cards/logo/visa.svg';
      break;
    case 'master':
    case 'mastercard':
      imagePath = '/cards/logo/mastercard.svg';
      break;
    case 'amex':
    case 'american express':
      imagePath = '/cards/logo/amex.svg';
      break;
    case 'elo':
      imagePath = '/cards/logo/elo.svg';
      break;
    default:
      return null;
  }
  
  if (!imagePath) return null;
  
  return (
    <img 
      src={imagePath} 
      alt={brand} 
      className="h-6 w-auto object-contain"
      onError={(e) => {
        // Se a imagem não carregar, ocultar
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

// Schema de validação
const checkoutSchema = z.object({
  paymentMethod: z.enum(['PIX_AUTOMATIC', 'CREDIT_CARD']),
  cpf: z.string().min(11, 'CPF é obrigatório').refine((cpf) => validateCPF(cpf.replace(/\D/g, '')), 'CPF inválido'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida'),
  
  // Campos obrigatórios apenas para cartão
  billingAddress: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    zipcode: z.string().refine((cep) => validateCEP(cep), 'CEP inválido'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().length(2, 'Estado é obrigatório'),
  }).optional(),
  
  // Dados do cartão (serão coletados via biblioteca Efí)
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  installments: z.number().min(1).max(12).optional(),
}).superRefine((data, ctx) => {
  // Se o método de pagamento for cartão, billingAddress é obrigatório
  if (data.paymentMethod === 'CREDIT_CARD') {
    if (!data.billingAddress) {
      ctx.addIssue({
        code: 'custom',
        message: 'Endereço de cobrança é obrigatório para pagamento com cartão',
        path: ['billingAddress'],
      });
      return;
    }

    if (!data.billingAddress.street || data.billingAddress.street.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Rua é obrigatória',
        path: ['billingAddress', 'street'],
      });
    }

    if (!data.billingAddress.number || data.billingAddress.number.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Número é obrigatório',
        path: ['billingAddress', 'number'],
      });
    }

    if (!data.billingAddress.neighborhood || data.billingAddress.neighborhood.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Bairro é obrigatório',
        path: ['billingAddress', 'neighborhood'],
      });
    }

    if (!data.billingAddress.zipcode || !validateCEP(data.billingAddress.zipcode)) {
      ctx.addIssue({
        code: 'custom',
        message: 'CEP inválido',
        path: ['billingAddress', 'zipcode'],
      });
    }

    if (!data.billingAddress.city || data.billingAddress.city.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        message: 'Cidade é obrigatória',
        path: ['billingAddress', 'city'],
      });
    }

    if (!data.billingAddress.state || data.billingAddress.state.length !== 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'Estado é obrigatório',
        path: ['billingAddress', 'state'],
      });
    }
  }
  // Se for PIX, billingAddress não é necessário - não validar
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Declaração de tipos para a biblioteca Efí (CDN)
declare global {
  interface Window {
    EfiPay?: any;
  }
}

export default function Checkout() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent, sendCapiEvent, sendUtmifyEvent, isInitialized } = useTracking();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>('');
  const [payeeCode, setPayeeCode] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox'); // Padrão sandbox
  const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
  const [efiLibraryLoaded, setEfiLibraryLoaded] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [addressData, setAddressData] = useState<{
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null>(null);
  const [cardNumberFormatted, setCardNumberFormatted] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'checking'>('pending');
  const [checkingPayment, setCheckingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'PIX_AUTOMATIC',
      cpf: '',
      phone: '',
      birthDate: '',
      installments: 1,
    },
  });

  const paymentMethod = watch('paymentMethod');
  const cpf = watch('cpf');
  const phone = watch('phone');
  const zipcode = watch('billingAddress.zipcode');

  // Limpar campos do endereço e erros quando mudar para PIX
  useEffect(() => {
    if (paymentMethod === 'PIX_AUTOMATIC') {
      setValue('billingAddress', undefined);
      setAddressData(null);
      // Limpar erros relacionados ao endereço
      clearErrors('billingAddress');
    }
  }, [paymentMethod, setValue, clearErrors]);

  // Carregar dados do plano
  useEffect(() => {
    const loadPlan = async () => {
      try {
        setLoading(true);
        if (!planId) {
          toast.error('Plano não especificado');
          navigate('/plans');
          return;
        }

        const response = await api.createCheckout<any>(planId);
        setPlan(response.plan);
        setPayeeCode(response.payeeCode || null);
        
        // Configurar ambiente (sandbox ou production)
        // IMPORTANTE: O ambiente deve corresponder ao payeeCode configurado
        if (response.environment) {
          const detectedEnv = response.environment === 'production' ? 'production' : 'sandbox';
          setEnvironment(detectedEnv);
          console.log('Ambiente detectado do backend:', detectedEnv);
          console.log('PayeeCode recebido:', response.payeeCode ? 'configurado' : 'não configurado');
          
          // Aviso se payeeCode não estiver configurado
          if (!response.payeeCode && paymentMethod === 'CREDIT_CARD') {
            console.warn('⚠️ PayeeCode não configurado! Configure o Payee Code no painel admin para pagamentos com cartão.');
          }
        } else {
          // Se não vier do backend, usar padrão sandbox
          console.warn('Ambiente não retornado pelo backend, usando padrão: sandbox');
          setEnvironment('sandbox');
        }

        // Pré-preencher campos do formulário se o usuário já tiver dados salvos
        if (response.userData) {
          if (response.userData.cpf) {
            setValue('cpf', formatCPF(response.userData.cpf));
          }
          if (response.userData.phone) {
            setValue('phone', formatPhone(response.userData.phone));
          }
          if (response.userData.birthDate) {
            setValue('birthDate', response.userData.birthDate);
          }
        }
      } catch (error: any) {
        toast.error('Erro ao carregar plano: ' + (error.message || 'Erro desconhecido'));
        navigate('/plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [planId, navigate]);

  // Tracking: InitiateCheckout quando plano carregar
  useEffect(() => {
    if (isInitialized && plan) {
      const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
      trackEvent('InitiateCheckout', {
        content_ids: [plan.id],
        content_type: 'subscription',
        value: planPrice,
        currency: 'BRL',
      });
    }
  }, [isInitialized, plan, trackEvent]);

  // Carregar biblioteca QR Code dinamicamente
  useEffect(() => {
    const loadQRCode = async () => {
      try {
        const { QRCodeSVG } = await import('qrcode.react');
        setQRCodeComponent(() => QRCodeSVG);
      } catch (error) {
        console.error('Erro ao carregar biblioteca QR Code:', error);
      }
    };
    loadQRCode();
  }, []);

  // Polling para verificar status do pagamento PIX
  useEffect(() => {
    if (!pixData?.txid || paymentStatus === 'paid') {
      return;
    }

    const checkPayment = async () => {
      try {
        setCheckingPayment(true);
        const response = await api.checkPaymentStatus<{
          status: string;
          payment: { status: string };
          subscription: { status: string };
        }>(pixData.txid);

        console.log('Status do pagamento:', response);

        // Verificar se o pagamento foi realmente confirmado
        // O status 'CONCLUIDA' ou 'paid' indica que o PIX foi pago
        // O payment.status === 'PAID' indica que está confirmado no banco
        // NÃO usar subscription.status === 'ATIVA' pois isso pode ser falso positivo
        const isPaid = response.status === 'CONCLUIDA' || 
                      response.status === 'paid' ||
                      response.payment?.status === 'PAID';
        
        console.log('Verificação de pagamento:', { 
          status: response.status, 
          paymentStatus: response.payment?.status,
          isPaid 
        });
        
        if (isPaid) {
          setPaymentStatus('paid');
          // Esconder o PIX quando o pagamento for confirmado
          setPixData(null);
          toast.success('Pagamento confirmado! Sua assinatura foi ativada.');
          
          // Tracking: Purchase (PIX confirmado)
          if (plan && user) {
            const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
            const eventId = `purchase_confirmed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log('Pagamento confirmado - Enviando eventos de tracking', { eventId, planPrice });
            
            trackEvent('Purchase', {
              content_ids: [plan.id],
              content_type: 'subscription',
              value: planPrice,
              currency: 'BRL',
              event_id: eventId,
            });

            // Enviar evento CAPI (que também envia para UTMify via backend)
            sendCapiEvent('Purchase', {
              email: user.email,
              userId: user.id,
            }, {
              value: planPrice,
              currency: 'BRL',
              planId: plan.id,
              planName: plan.title,
              event_id: eventId,
            }).then(() => {
              console.log('CAPI event sent (includes UTMify via backend)');
            }).catch((error) => {
              console.error('Error sending CAPI event:', error);
            });

            // Enviar evento UTMify via frontend (pixel/beacon) - método mais confiável
            sendUtmifyEvent(eventId, planPrice, 'BRL');
            console.log('UTMify: Purchase confirmed event sent via pixel');
          }
          
          // Redirecionar após 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (error: any) {
        // Não mostrar erro se ainda estiver pendente
        if (error?.response?.status !== 400) {
          console.error('Erro ao verificar status do pagamento:', error);
        }
      } finally {
        setCheckingPayment(false);
      }
    };

    // Verificar imediatamente
    checkPayment();

    // Verificar a cada 5 segundos
    const interval = setInterval(checkPayment, 5000);

    return () => clearInterval(interval);
  }, [pixData?.txid, paymentStatus, navigate]);

  // Carregar biblioteca Efí
  useEffect(() => {
    if (paymentMethod === 'CREDIT_CARD' && !window.EfiPay && !efiLibraryLoaded) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/efipay/js-payment-token-efi/dist/payment-token-efi-umd.min.js';
      script.async = true;
      script.onload = () => {
        // Aguardar um pouco para garantir que a biblioteca está totalmente inicializada
        setTimeout(() => {
          console.log('Script carregado, verificando window.EfiPay:', window.EfiPay);
          console.log('Tipo de window.EfiPay:', typeof window.EfiPay);
          console.log('Propriedades de window.EfiPay:', window.EfiPay ? Object.keys(window.EfiPay) : 'null');
          
          // A biblioteca payment-token-efi expõe window.EfiPay.CreditCard
          if (window.EfiPay && window.EfiPay.CreditCard) {
            const CreditCard = window.EfiPay.CreditCard;
            
            // Verificar se getPaymentToken está disponível
            if (typeof CreditCard === 'function' && (CreditCard.getPaymentToken || (CreditCard.prototype && CreditCard.prototype.getPaymentToken))) {
              setEfiLibraryLoaded(true);
              console.log('Biblioteca Efí carregada com sucesso, CreditCard.getPaymentToken disponível');
            } else if (typeof CreditCard === 'object' && typeof CreditCard.getPaymentToken === 'function') {
              setEfiLibraryLoaded(true);
              console.log('Biblioteca Efí carregada com sucesso, CreditCard.getPaymentToken disponível');
            } else {
              console.error('Biblioteca Efí carregada mas getPaymentToken não está disponível em CreditCard');
              console.error('Estrutura CreditCard:', CreditCard);
            }
          } else {
            console.error('Biblioteca Efí carregada mas CreditCard não está disponível');
            console.error('Estrutura da biblioteca:', window.EfiPay);
          }
        }, 300); // Aumentar tempo de espera
      };
      script.onerror = () => {
        console.error('Erro ao carregar biblioteca Efí');
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup
        const existingScript = document.querySelector('script[src*="payment-token-efi"]');
        if (existingScript) {
          // Não remover o script, apenas marcar como não carregado se necessário
        }
      };
    } else if (window.EfiPay) {
      // Verificar se já está disponível
      let efiLib = window.EfiPay;
      if (efiLib.default) {
        efiLib = efiLib.default;
      }
      if (typeof efiLib.getPaymentToken === 'function') {
        setEfiLibraryLoaded(true);
      }
    }
  }, [paymentMethod, efiLibraryLoaded]);

  // Aplicar máscaras
  useEffect(() => {
    if (cpf) {
      const formatted = formatCPF(cpf);
      if (formatted !== cpf) {
        setValue('cpf', formatted, { shouldValidate: false });
      }
    }
  }, [cpf, setValue]);

  useEffect(() => {
    if (phone) {
      const formatted = formatPhone(phone);
      if (formatted !== phone) {
        setValue('phone', formatted, { shouldValidate: false });
      }
    }
  }, [phone, setValue]);

  // Buscar endereço por CEP
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      return;
    }

    setLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        setAddressData(null);
        // Limpar campos de endereço
        setValue('billingAddress.street', '');
        setValue('billingAddress.neighborhood', '');
        setValue('billingAddress.city', '');
        setValue('billingAddress.state', '');
        return;
      }

      // Preencher dados do endereço
      const address = {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      };

      setAddressData(address);
      setValue('billingAddress.street', address.street);
      setValue('billingAddress.neighborhood', address.neighborhood);
      setValue('billingAddress.city', address.city);
      setValue('billingAddress.state', address.state);
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar endereço. Tente novamente.');
      setAddressData(null);
    } finally {
      setLoadingCEP(false);
    }
  };

  useEffect(() => {
    if (zipcode) {
      const formatted = formatCEP(zipcode);
      if (formatted !== zipcode) {
        setValue('billingAddress.zipcode', formatted, { shouldValidate: false });
      }

      // Buscar endereço quando CEP estiver completo (8 dígitos)
      const cleanCEP = zipcode.replace(/\D/g, '');
      if (cleanCEP.length === 8) {
        fetchAddressByCEP(cleanCEP);
      } else {
        // Limpar dados se CEP não estiver completo
        setAddressData(null);
      }
    }
  }, [zipcode, setValue]);

  // Identificar bandeira do cartão manualmente
  const handleCardNumberChange = (value: string) => {
    // Remover todos os não-dígitos
    const cardNumber = value.replace(/\D/g, '');
    
    // Formatar de 4 em 4 números
    let formatted = cardNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limitar a 16 dígitos (19 caracteres com espaços)
    if (formatted.length > 19) {
      formatted = formatted.substring(0, 19);
      // Recalcular cardNumber se foi truncado
      const truncatedNumber = formatted.replace(/\D/g, '');
      setValue('cardNumber', truncatedNumber);
    } else {
    setValue('cardNumber', cardNumber);
    }
    
    // Atualizar valor formatado para exibir no input
    setCardNumberFormatted(formatted);
    
    // Detectar bandeira manualmente baseado no primeiro dígito
    if (cardNumber.length >= 1) {
      const firstDigit = cardNumber[0];
      const firstTwoDigits = cardNumber.substring(0, 2);
      const firstFourDigits = cardNumber.substring(0, 4);
      
      let detectedBrand = '';
      
      if (firstDigit === '4') {
        detectedBrand = 'visa';
      } else if (firstTwoDigits >= '51' && firstTwoDigits <= '55') {
        detectedBrand = 'master';
      } else if (firstTwoDigits === '34' || firstTwoDigits === '37') {
        detectedBrand = 'amex';
      } else if (
        firstFourDigits === '4011' || 
        firstFourDigits === '4312' || 
        firstFourDigits === '4389' ||
        firstFourDigits === '5041' ||
        firstFourDigits === '4514' ||
        firstFourDigits === '5090' ||
        (firstFourDigits >= '5067' && firstFourDigits <= '5099')
      ) {
        detectedBrand = 'elo';
      }
      
      if (detectedBrand) {
        setCardBrand(detectedBrand);
      } else if (cardNumber.length === 0) {
        // Limpar bandeira se o campo estiver vazio
        setCardBrand('');
      }
    }
  };

  // Gerar payment_token do cartão
  // Função refatorada seguindo exatamente a documentação oficial da EFí
  const generatePaymentToken = async (formData: CheckoutFormData): Promise<string | null> => {
    if (paymentMethod !== 'CREDIT_CARD') {
      return null;
    }

    // Verificar se biblioteca está carregada
    if (!window.EfiPay?.CreditCard) {
      throw new Error('Biblioteca Efí não carregada. Aguarde um momento e tente novamente.');
    }

    if (!payeeCode) {
      throw new Error('Identificador de conta não configurado. Configure o Payee Code no painel admin.');
    }

    const CreditCard = window.EfiPay.CreditCard;

    // 1. Verificar se o script de fingerprint está bloqueado (recomendação da EFí)
    try {
      const isBlocked = await CreditCard.isScriptBlocked();
      if (isBlocked) {
        throw new Error('O script de segurança da EFí está sendo bloqueado. Desative extensões do navegador que bloqueiam scripts e tente novamente.');
      }
    } catch (error: any) {
      // Se o método não existir, apenas logar e continuar
      console.warn('Não foi possível verificar bloqueio do script:', error?.message);
    }

    // 2. Preparar e validar dados do cartão
    const cardNumber = (formData.cardNumber || '').replace(/\D/g, ''); // Remover todos os não-dígitos
    const cvv = (formData.cardCvv || '').replace(/\D/g, '');
    const expiryParts = (formData.cardExpiry || '').split('/');
    
    // Formatar mês com 2 dígitos (01-12)
    const expirationMonthRaw = expiryParts[0]?.trim() || '';
    const expirationMonth = expirationMonthRaw 
      ? parseInt(expirationMonthRaw, 10).toString().padStart(2, '0') 
      : '';
    
    // Formatar ano com 4 dígitos (YYYY)
    const expirationYearRaw = expiryParts[1]?.trim() || '';
    let expirationYear = '';
    if (expirationYearRaw.length === 2) {
      expirationYear = `20${expirationYearRaw}`;
    } else if (expirationYearRaw.length === 4) {
      expirationYear = expirationYearRaw;
    }

    // Validações básicas
    if (!cardNumber || !cvv || !expirationMonth || !expirationYear) {
      throw new Error('Dados do cartão incompletos. Preencha todos os campos.');
    }

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      throw new Error('Número do cartão inválido. Deve ter entre 13 e 19 dígitos.');
    }

    if (cvv.length < 3 || cvv.length > 4) {
      throw new Error('CVV inválido. Deve ter 3 ou 4 dígitos.');
    }

    // Validar mês (01-12)
    const monthNum = parseInt(expirationMonth, 10);
    if (monthNum < 1 || monthNum > 12) {
      throw new Error('Mês de expiração inválido. Use um valor entre 01 e 12.');
    }

    // Validar ano (deve ser futuro)
    const yearNum = parseInt(expirationYear, 10);
    const currentYear = new Date().getFullYear();
    if (yearNum < currentYear) {
      throw new Error('Ano de expiração inválido. O cartão já está vencido.');
    }

    // Validação específica do sandbox da EFí
    if (environment === 'sandbox') {
      const lastDigit = cardNumber[cardNumber.length - 1];
      if (lastDigit === '1') {
        throw new Error('No ambiente sandbox, cartões terminados em "1" retornam erro "Dados do cartão inválidos" (comportamento esperado da EFí). Use um cartão que termine em 0, 4-9.');
      }
      if (lastDigit === '2' || lastDigit === '3') {
        throw new Error(`No ambiente sandbox, cartões terminados em "${lastDigit}" retornam erro de autorização (comportamento esperado da EFí). Use um cartão que termine em 0, 4-9.`);
      }
    }

    // 3. Verificar bandeira usando a biblioteca EFí (recomendação da documentação)
    // IMPORTANTE: A biblioteca EFí espera os nomes exatos: "visa", "mastercard", "amex", "elo", "hipercard"
    // NÃO devemos normalizar "mastercard" para "master" aqui, pois a API precisa do nome completo
    let brand: string;
    try {
      brand = await CreditCard
        .setCardNumber(cardNumber)
        .verifyCardBrand();
      
      // A biblioteca EFí retorna os nomes corretos: "visa", "mastercard", "amex", "elo", "hipercard"
      // Manter exatamente como retornado pela biblioteca
      if (!brand || brand === 'undefined' || brand === 'unsupported') {
        // Se a biblioteca não detectou, tentar detectar manualmente
    if (cardNumber[0] === '4') {
      brand = 'visa';
    } else if (cardNumber.substring(0, 2) >= '51' && cardNumber.substring(0, 2) <= '55') {
          brand = 'mastercard'; // IMPORTANTE: usar "mastercard" e não "master"
    } else if (cardNumber.substring(0, 2) === '34' || cardNumber.substring(0, 2) === '37') {
      brand = 'amex';
    } else if (
      cardNumber.substring(0, 4) === '4011' || 
      cardNumber.substring(0, 4) === '4312' || 
      cardNumber.substring(0, 4) === '4389' ||
      (cardNumber.substring(0, 4) >= '5067' && cardNumber.substring(0, 4) <= '5099')
    ) {
      brand = 'elo';
        } else {
          throw new Error('Bandeira do cartão não reconhecida. Use Visa, Mastercard, Amex ou Elo.');
        }
      }
    } catch (error: any) {
      console.warn('Erro ao verificar bandeira com biblioteca, usando detecção manual:', error?.message);
      // Fallback para detecção manual
      if (cardNumber[0] === '4') {
        brand = 'visa';
      } else if (cardNumber.substring(0, 2) >= '51' && cardNumber.substring(0, 2) <= '55') {
        brand = 'mastercard'; // IMPORTANTE: usar "mastercard" e não "master"
      } else if (cardNumber.substring(0, 2) === '34' || cardNumber.substring(0, 2) === '37') {
        brand = 'amex';
      } else if (
        cardNumber.substring(0, 4) === '4011' || 
        cardNumber.substring(0, 4) === '4312' || 
        cardNumber.substring(0, 4) === '4389' ||
        (cardNumber.substring(0, 4) >= '5067' && cardNumber.substring(0, 4) <= '5099')
      ) {
        brand = 'elo';
      } else {
        throw new Error('Bandeira do cartão não reconhecida. Use Visa, Mastercard, Amex ou Elo.');
      }
    }

    // Validar que a bandeira é suportada (usar nomes exatos da API EFí)
    const supportedBrands = ['visa', 'mastercard', 'amex', 'elo', 'hipercard'];
    if (!supportedBrands.includes(brand)) {
      throw new Error(`Bandeira "${brand}" não é suportada. Use Visa, Mastercard, Amex ou Elo.`);
    }

    // 4. Preparar objeto cardData conforme documentação oficial
    // IMPORTANTE: Todos os campos devem estar no formato exato esperado pela EFí
    // A API EFí espera: "visa", "mastercard", "amex", "elo", "hipercard" (nomes completos)
    const cardData = {
      brand: brand, // 'visa', 'mastercard', 'amex', 'elo', 'hipercard' (minúsculas, nomes completos)
      number: cardNumber, // Apenas dígitos, sem espaços ou caracteres especiais
      cvv: cvv, // 3 ou 4 dígitos, apenas números
      expiration_month: expirationMonth, // Formato: "01" a "12" (string com 2 dígitos)
      expiration_year: expirationYear, // Formato: "2024", "2025", etc (string com 4 dígitos)
      reuse: false, // Boolean: false = uso único, true = reutilizável
    };

    // Validação final rigorosa antes de enviar para a biblioteca
    // IMPORTANTE: Validar com os nomes exatos que a API EFí espera
    if (!cardData.brand || !['visa', 'mastercard', 'amex', 'elo', 'hipercard'].includes(cardData.brand)) {
      throw new Error(`Bandeira inválida: ${cardData.brand}. Deve ser visa, mastercard, amex, elo ou hipercard.`);
    }

    if (!cardData.number || cardData.number.length < 13 || cardData.number.length > 19) {
      throw new Error(`Número do cartão inválido: ${cardData.number.length} dígitos. Deve ter entre 13 e 19 dígitos.`);
    }

    if (!cardData.cvv || (cardData.cvv.length !== 3 && cardData.cvv.length !== 4)) {
      throw new Error(`CVV inválido: ${cardData.cvv.length} dígitos. Deve ter 3 ou 4 dígitos.`);
    }

    if (!cardData.expiration_month || !/^(0[1-9]|1[0-2])$/.test(cardData.expiration_month)) {
      throw new Error(`Mês inválido: ${cardData.expiration_month}. Deve ser entre "01" e "12".`);
    }

    if (!cardData.expiration_year || !/^\d{4}$/.test(cardData.expiration_year)) {
      throw new Error(`Ano inválido: ${cardData.expiration_year}. Deve ter 4 dígitos (ex: "2026").`);
    }

    // Validação crítica: Verificar se payeeCode e ambiente estão compatíveis
    if (!payeeCode || payeeCode.trim().length === 0) {
      throw new Error('PayeeCode não configurado. Configure o Identificador de Conta (Payee Code) no painel admin da EFí.');
    }

    // Validar formato do payeeCode (geralmente é um hash de 32 caracteres)
    if (payeeCode.trim().length < 10) {
      console.warn('⚠️ PayeeCode parece estar muito curto. Verifique se está correto.');
    }

    console.log('=== DADOS DO CARTÃO PREPARADOS ===');
    console.log('Bandeira:', cardData.brand);
    console.log('Número:', `${cardNumber.substring(0, 4)}****${cardNumber.substring(cardNumber.length - 4)}`);
    console.log('CVV:', '***');
    console.log('Mês:', cardData.expiration_month);
    console.log('Ano:', cardData.expiration_year);
    console.log('PayeeCode:', payeeCode);
    console.log('Ambiente:', environment);
    console.log('CardData completo (sem dados sensíveis):', {
      brand: cardData.brand,
      number_length: cardData.number.length,
      cvv_length: cardData.cvv.length,
      expiration_month: cardData.expiration_month,
      expiration_year: cardData.expiration_year,
      reuse: cardData.reuse,
    });
        console.log('==================================');
        
    // Validação de compatibilidade entre payeeCode e ambiente
    // PayeeCode de sandbox geralmente tem formato diferente do de produção
    // Esta é uma validação heurística para detectar possíveis incompatibilidades
    if (payeeCode && environment) {
      const payeeCodeLength = payeeCode.trim().length;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isDev = import.meta.env.DEV;
      
      // Aviso se ambiente for production mas estiver em desenvolvimento
      if (environment === 'production' && (isDev || isLocalhost)) {
        console.warn('⚠️ ATENÇÃO: Ambiente está configurado como PRODUCTION mas você está em desenvolvimento!');
        console.warn('⚠️ Verifique se o PayeeCode corresponde ao ambiente correto.');
        console.warn('⚠️ Para sandbox, certifique-se de que EFI_SANDBOX=true no backend.');
        console.warn('⚠️ O PayeeCode de sandbox é diferente do PayeeCode de produção!');
        console.warn(`⚠️ PayeeCode atual: ${payeeCode.substring(0, 8)}... (tamanho: ${payeeCodeLength})`);
      }
      
      // Aviso se payeeCode parece muito curto (pode indicar configuração incorreta)
      if (payeeCodeLength < 20) {
        console.warn('⚠️ AVISO: PayeeCode parece estar muito curto. Verifique se está correto.');
        console.warn(`⚠️ PayeeCode atual tem ${payeeCodeLength} caracteres. Geralmente tem 32+ caracteres.`);
      }
      
      // Log informativo sobre a configuração
      console.log(`✅ Configuração validada - PayeeCode: ${payeeCode.substring(0, 8)}... (${payeeCodeLength} chars), Ambiente: ${environment}`);
    }

    // 5. Gerar payment_token usando a biblioteca
    return new Promise(async (resolve, reject) => {
      // Timeout de segurança (30 segundos)
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao gerar token de pagamento. Tente novamente.'));
      }, 30000);

      try {
        // Validar payeeCode antes de usar
        if (!payeeCode || payeeCode.trim().length === 0) {
          throw new Error('PayeeCode não configurado. Configure o Identificador de Conta (Payee Code) no painel admin.');
        }

        // Validar ambiente
        if (environment !== 'sandbox' && environment !== 'production') {
          throw new Error(`Ambiente inválido: ${environment}. Deve ser 'sandbox' ou 'production'.`);
        }

        console.log('=== CONFIGURAÇÃO DA BIBLIOTECA EFÍ ===');
        console.log('PayeeCode:', payeeCode);
        console.log('Ambiente:', environment);
        console.log('Bandeira:', cardData.brand);
        console.log('=====================================');

        // Ativar modo debug sempre (para identificar problemas)
        if (typeof CreditCard.debugger === 'function') {
          CreditCard.debugger(true);
          console.log('Modo debug da biblioteca EFí ativado');
        }

        // Preparar dados do cartão no formato esperado pela biblioteca
        // IMPORTANTE: A biblioteca espera expirationMonth e expirationYear como strings
        const creditCardData = {
          number: cardData.number,
          expirationMonth: cardData.expiration_month, // String "01" a "12"
          expirationYear: cardData.expiration_year, // String "2024", "2025", etc
          cvv: cardData.cvv,
          brand: cardData.brand,
          // holderName não é obrigatório para tokenização, mas pode ser útil
        };

        console.log('=== DADOS PARA SETCREDITCARDDATA ===');
        console.log('Número:', `${cardData.number.substring(0, 4)}****${cardData.number.substring(cardData.number.length - 4)}`);
        console.log('Mês:', creditCardData.expirationMonth);
        console.log('Ano:', creditCardData.expirationYear);
        console.log('CVV:', '***');
        console.log('Bandeira:', creditCardData.brand);
        console.log('====================================');

        // Usar a API recomendada: .setAccount().setEnvironment().setCreditCardData().getPaymentToken()
        // Esta é a forma usada no exemplo PHP oficial da EFí
        try {
          const paymentTokenResult = await CreditCard
            .setAccount(payeeCode)
            .setEnvironment(environment)
            .setCreditCardData(creditCardData)
            .getPaymentToken();

          clearTimeout(timeout);

          // Extrair token da resposta
          const token = paymentTokenResult?.data?.payment_token || paymentTokenResult?.payment_token || paymentTokenResult?.token;
          
                if (token) {
            console.log('Payment token gerado com sucesso usando setCreditCardData()');
                  resolve(token);
                } else {
            console.error('Resposta sem token:', paymentTokenResult);
            reject(new Error('Token de pagamento não retornado pela biblioteca EFí'));
          }
        } catch (error: any) {
          clearTimeout(timeout);
          
          // Construir mensagem de erro detalhada
                const errorDetails: string[] = [];
                
                if (error?.error_description) {
                  errorDetails.push(error.error_description);
                } else if (error?.message) {
                  errorDetails.push(error.message);
          } else if (typeof error === 'string') {
            errorDetails.push(error);
                }
                
                if (error?.code) {
                  errorDetails.push(`Código: ${error.code}`);
                }
                
                if (error?.error) {
                  errorDetails.push(`Tipo: ${error.error}`);
                }
                
                let errorMessage = errorDetails.length > 0 
                  ? errorDetails.join(' | ') 
                  : 'Erro ao gerar token de pagamento';
                
          // Adicionar dicas específicas para erro de dados inválidos
          if (error?.error === 'invalid_credit_card_data' || error?.message?.includes('inválidos') || error?.error_description?.includes('inválidos')) {
                  errorMessage += '\n\n💡 Possíveis causas:';
                  errorMessage += '\n- PayeeCode incorreto ou incompatível com o ambiente (sandbox/produção)';
                  errorMessage += '\n- Verifique se o PayeeCode no painel admin está correto';
                  errorMessage += '\n- No sandbox, cartões terminados em 1, 2 ou 3 retornam erros simulados';
            errorMessage += '\n- Verifique se o ramo de atividade está cadastrado na conta EFí';
                  errorMessage += `\n- PayeeCode usado: ${payeeCode}`;
                  errorMessage += `\n- Ambiente: ${environment}`;
                }
                
          console.error('Erro ao gerar payment_token:', error);
                reject(new Error(errorMessage));
        }
      } catch (error: any) {
        clearTimeout(timeout);
        const errorMessage = error?.message || error?.toString() || 'Erro desconhecido ao chamar biblioteca EFí';
        console.error('Erro síncrono:', error);
        reject(new Error(errorMessage));
      }
    });
  };

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setProcessing(true);
      console.log('Iniciando processamento de pagamento', { data, paymentMethod });

      let paymentTokenToUse = paymentToken;

      if (paymentMethod === 'CREDIT_CARD') {
        // Validar dados do cartão
        if (!data.cardNumber || !data.cardName || !data.cardExpiry || !data.cardCvv) {
          toast.error('Preencha todos os dados do cartão');
          setProcessing(false);
          return;
        }

        if (!data.billingAddress) {
          toast.error('Preencha o endereço completo');
          setProcessing(false);
          return;
        }

        // Gerar payment_token
        paymentTokenToUse = await generatePaymentToken(data);
        if (!paymentTokenToUse) {
          toast.error('Erro ao processar cartão. Tente novamente.');
          setProcessing(false);
          return;
        }

        // Tracking: AddPaymentInfo (cartão)
        if (plan) {
          const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
          trackEvent('AddPaymentInfo', {
            content_ids: [plan.id],
            content_type: 'subscription',
            value: planPrice,
            currency: 'BRL',
          });
        }
      } else if (paymentMethod === 'PIX_AUTOMATIC' && plan) {
        // Tracking: AddPaymentInfo (PIX)
        const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
        trackEvent('AddPaymentInfo', {
          content_ids: [plan.id],
          content_type: 'subscription',
          value: planPrice,
          currency: 'BRL',
        });
      }

      // Preparar dados para envio
      const checkoutData = {
        paymentMethod: data.paymentMethod,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        birthDate: data.birthDate,
        ...(data.paymentMethod === 'CREDIT_CARD' && {
          billingAddress: data.billingAddress,
          paymentToken: paymentTokenToUse,
          installments: data.installments || 1,
        }),
      };

      console.log('Enviando dados para processamento', checkoutData);

      const response = await api.processPayment<any>(planId!, checkoutData);

      console.log('Resposta do servidor', response);

      if (data.paymentMethod === 'PIX_AUTOMATIC') {
        // Mostrar dados do Pix
        if (response.pixData) {
          setPixData(response.pixData);
          toast.success('Pix gerado!.');
          
          // IMPORTANTE: Não enviar eventos de "Purchase" quando o PIX é gerado
          // O evento "Purchase" só deve ser enviado quando o pagamento for realmente confirmado
          // O backend já envia "waiting_payment" para o UTMify quando o PIX é gerado
          console.log('PIX gerado - Aguardando confirmação de pagamento para enviar eventos de Purchase');
        } else {
          toast.error('Resposta do servidor não contém dados do Pix');
          console.error('Resposta sem pixData:', response);
        }
      } else {
        // Cartão processado
        toast.success('Pagamento processado com sucesso!');
        
        // Tracking: Purchase (cartão)
        if (plan && user) {
          const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
          const eventId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          trackEvent('Purchase', {
            content_ids: [plan.id],
            content_type: 'subscription',
            value: planPrice,
            currency: 'BRL',
            event_id: eventId,
          });

          // Enviar evento CAPI
          sendCapiEvent('Purchase', {
            email: user.email,
            userId: user.id,
            phone: data.phone.replace(/\D/g, ''),
          }, {
            value: planPrice,
            currency: 'BRL',
            planId: plan.id,
            planName: plan.title,
            event_id: eventId,
          });

          // Enviar evento UTMify via frontend (pixel/beacon)
          sendUtmifyEvent(eventId, planPrice, 'BRL');
          
          console.log('Eventos de tracking disparados (CAPI + UTMify)');
        }

        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro desconhecido';
      toast.error('Erro ao processar pagamento: ' + errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const planPrice = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/plans')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos planos
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resumo do Plano */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Assinatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{plan.title}</h3>
                {plan.description && (
                  <p className="text-muted-foreground mt-1">{plan.description}</p>
                )}
              </div>

              <div className="flex items-baseline gap-2 pt-4 border-t">
                <span className="text-3xl font-bold">
                  {planPrice === 0 ? 'Grátis' : `R$ ${planPrice.toFixed(2)}`}
                </span>
                {planPrice > 0 && (
                  <span className="text-muted-foreground">/mês</span>
                )}
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  {plan.features.map((feature: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm">{feature.text || feature}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Pagamento seguro e criptografado</span>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Checkout */}
          <Card>
            <CardHeader>
              <CardTitle>Finalizar Assinatura</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para concluir seu pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pixData ? (
                // Exibir QR Code e PIX Copy/Paste
                <div className="space-y-4">
                  {paymentStatus === 'paid' ? (
                    <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
                        Pagamento Confirmado!
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Sua assinatura foi ativada com sucesso. Redirecionando...
                      </p>
                    </div>
                  ) : (
                    <>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-4">Escaneie o QR Code para pagar</h3>
                    {pixData.pixCopyPaste && QRCodeComponent ? (
                      <div className="flex justify-center mb-4">
                        <QRCodeComponent
                          value={pixData.pixCopyPaste}
                          size={256}
                          level="M"
                          includeMargin={true}
                          className="bg-white p-4 rounded-lg"
                        />
                      </div>
                    ) : pixData.qrCode ? (
                      <img src={pixData.qrCode} alt="QR Code PIX" className="mx-auto mb-4" />
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {pixData.pixCopyPaste && (
                    <div className="space-y-2">
                      <Label>PIX Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input value={pixData.pixCopyPaste} readOnly className="font-mono text-xs" />
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(pixData.pixCopyPaste);
                            toast.success('PIX Copia e Cola copiado!');
                          }}
                          className="hover:bg-primary/85 dark:hover:bg-primary/80"
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}

                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        {checkingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verificando pagamento...</span>
                          </>
                        ) : (
                          <span>Verificando pagamento automaticamente...</span>
                        )}
                      </div>

                  <p className="text-sm text-muted-foreground text-center">
                    Após o pagamento, sua assinatura será ativada automaticamente.
                  </p>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit, (errors) => {
                  console.error('Erros de validação:', errors);
                  toast.error('Preencha todos os campos obrigatórios corretamente');
                })} className="space-y-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Dados Pessoais</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        {...register('cpf')}
                        maxLength={14}
                      />
                      {errors.cpf && (
                        <p className="text-sm text-destructive">{errors.cpf.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 98765-4321"
                        {...register('phone')}
                        maxLength={15}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...register('birthDate')}
                      />
                      {errors.birthDate && (
                        <p className="text-sm text-destructive">{errors.birthDate.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Método de Pagamento */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Forma de Pagamento</h3>
                    
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value: 'PIX_AUTOMATIC' | 'CREDIT_CARD') => setValue('paymentMethod', value)}
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="PIX_AUTOMATIC" id="pix" />
                        <Label htmlFor="pix" className="flex-1 cursor-pointer flex items-center gap-2">
                          <QrCode className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Pix Automático</div>
                            <div className="text-sm text-muted-foreground">Pagamento mensal automático via Pix</div>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="CREDIT_CARD" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Cartão de Crédito</div>
                            <div className="text-sm text-muted-foreground">Cobrança mensal no cartão</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Formulário de Cartão */}
                  {paymentMethod === 'CREDIT_CARD' && (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Dados do Cartão</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Nome no Cartão *</Label>
                        <Input
                          id="cardName"
                          placeholder="NOME COMO ESTÁ NO CARTÃO"
                          {...register('cardName')}
                          autoComplete="cc-name"
                        />
                        {errors.cardName && (
                          <p className="text-sm text-destructive">{errors.cardName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Número do Cartão *</Label>
                        <div className="relative">
                        <Input
                          id="cardNumber"
                            placeholder="4929 7607 2754 7746"
                            value={cardNumberFormatted}
                          onChange={(e) => {
                              handleCardNumberChange(e.target.value);
                          }}
                          maxLength={19}
                          autoComplete="cc-number"
                            className="pr-12"
                        />
                        {cardBrand && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                              {getCardBrandIcon(cardBrand)}
                            </div>
                        )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardExpiry">Validade *</Label>
                          <Input
                            id="cardExpiry"
                            placeholder="MM/AA"
                            {...register('cardExpiry')}
                            maxLength={5}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              setValue('cardExpiry', value);
                            }}
                            autoComplete="cc-exp"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardCvv">CVV *</Label>
                          <Input
                            id="cardCvv"
                            placeholder="123"
                            type="password"
                            {...register('cardCvv')}
                            maxLength={4}
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>

                      {/* Endereço */}
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">Endereço de Cobrança</h4>
                        
                        {/* CEP - Primeiro campo */}
                          <div className="space-y-2">
                          <Label htmlFor="zipcode">CEP *</Label>
                          <div className="relative">
                            <Input
                              id="zipcode"
                              placeholder="00000-000"
                              {...register('billingAddress.zipcode')}
                              maxLength={9}
                            />
                            {loadingCEP && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {errors.billingAddress?.zipcode && (
                            <p className="text-sm text-destructive">{errors.billingAddress.zipcode.message}</p>
                            )}
                          </div>

                        {/* Endereço preenchido automaticamente - Exibido como texto */}
                        {addressData && (
                          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                          <div className="space-y-2">
                              <div className="flex items-start gap-4">
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Rua</Label>
                                  <p className="text-sm font-medium">{addressData.street || 'Não informado'}</p>
                                </div>
                                <div className="w-32">
                                  <Label className="text-xs text-muted-foreground">Número *</Label>
                            <Input
                              id="number"
                                    placeholder="123"
                              {...register('billingAddress.number')}
                                    className="mt-0"
                            />
                            {errors.billingAddress?.number && (
                                    <p className="text-xs text-destructive mt-1">{errors.billingAddress.number.message}</p>
                            )}
                          </div>
                        </div>
                        </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Bairro</Label>
                                <p className="text-sm font-medium">{addressData.neighborhood || 'Não informado'}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Cidade</Label>
                                <p className="text-sm font-medium">{addressData.city || 'Não informado'}</p>
                              </div>
                          </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">Estado</Label>
                              <p className="text-sm font-medium">{addressData.state || 'Não informado'}</p>
                          </div>
                        </div>
                        )}

                        {/* Mensagem e campos manuais quando CEP não foi encontrado */}
                        {!addressData && zipcode && zipcode.replace(/\D/g, '').length === 8 && !loadingCEP && (
                          <div className="space-y-4">
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                CEP não encontrado. Por favor, preencha o endereço manualmente.
                              </p>
                            </div>
                        
                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="street">Rua *</Label>
                            <Input
                              id="street"
                              {...register('billingAddress.street')}
                            />
                            {errors.billingAddress?.street && (
                              <p className="text-sm text-destructive">{errors.billingAddress.street.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="number">Número *</Label>
                            <Input
                              id="number"
                              {...register('billingAddress.number')}
                            />
                            {errors.billingAddress?.number && (
                              <p className="text-sm text-destructive">{errors.billingAddress.number.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="neighborhood">Bairro *</Label>
                          <Input
                            id="neighborhood"
                            {...register('billingAddress.neighborhood')}
                          />
                          {errors.billingAddress?.neighborhood && (
                            <p className="text-sm text-destructive">{errors.billingAddress.neighborhood.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-[1fr_2fr] gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">Cidade *</Label>
                            <Input
                              id="city"
                              {...register('billingAddress.city')}
                            />
                            {errors.billingAddress?.city && (
                              <p className="text-sm text-destructive">{errors.billingAddress.city.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state">Estado *</Label>
                          <Select
                            value={watch('billingAddress.state') || ''}
                            onValueChange={(value) => setValue('billingAddress.state', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {BRAZIL_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.billingAddress?.state && (
                            <p className="text-sm text-destructive">{errors.billingAddress.state.message}</p>
                          )}
                        </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 hover:bg-primary/85 dark:hover:bg-primary/80"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Finalizar Pagamento
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

