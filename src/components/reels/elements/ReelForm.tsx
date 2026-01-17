import { useState, useEffect, useImperativeHandle, forwardRef, memo, useRef } from 'react';
import { SlideElement } from '@/contexts/BuilderContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  let parsed: any = {};
  if (typeof uiConfig === 'string') {
    try {
      parsed = JSON.parse(uiConfig);
    } catch {
      return {};
    }
  } else if (typeof uiConfig === 'object' && uiConfig !== null) {
    parsed = uiConfig;
  } else {
    return {};
  }
  
  // Migrar 'none' antigo para 'success'
  if (parsed.buttonDestination === 'none') {
    parsed.buttonDestination = 'success';
  }
  
  return parsed;
};

interface ReelFormProps {
  element: SlideElement;
  onNextSlide?: () => void;
  onFormSubmit?: (data: Record<string, any>) => void;
  onValidationChange?: (isValid: boolean) => void;
  isActive?: boolean;
  reelId?: string;
  slideId?: string;
}

export interface ReelFormRef {
  isFormValid: () => boolean;
  submitForm: () => Promise<void>;
  getFormData: () => Record<string, any>;
}

// Validações
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  // Telefone brasileiro: mínimo 10 dígitos (DDD + número), máximo 11
  return cleaned.length >= 10 && cleaned.length <= 11;
};

const validateNumber = (value: string): boolean => {
  return !isNaN(Number(value)) && value.trim() !== '';
};

const validateField = (field: any, value: string): string | null => {
  // Campo obrigatório vazio
  if (field.required && !value.trim()) {
    return 'Este campo é obrigatório';
  }

  // Se não é obrigatório e está vazio, não precisa validar formato
  if (!value.trim()) {
    return null;
  }

  // Validação por tipo
  switch (field.type) {
    case 'email':
      if (!validateEmail(value)) {
        return 'Email inválido';
      }
      break;
    case 'tel':
      if (!validatePhone(value)) {
        return 'Telefone inválido';
      }
      break;
    case 'number':
      if (!validateNumber(value)) {
        return 'Número inválido';
      }
      break;
    default:
      break;
  }

  return null;
};

const ReelFormComponent = forwardRef<ReelFormRef, ReelFormProps>(
  ({ element, onNextSlide, onFormSubmit, onValidationChange, isActive = false, reelId, slideId }, ref) => {
    const config = normalizeUiConfig(element.uiConfig);
    const {
      fields = [],
      buttonEnabled = true,
      buttonTitle = 'Enviar',
      buttonDestination = 'next-slide' as 'next-slide' | 'url' | 'success',
      buttonUrl = '',
      buttonOpenInNewTab = false,
      lockSlide = false,
      hideTitles = false,
      gap = 16,
      borderRadius = 8,
      backgroundColor = '#ffffff',
      textColor = '#000000',
      borderColor = '#e5e7eb',
      placeholderColor = '#999999',
      focusColor = '#007bff',
      buttonBackgroundColor = '#007bff',
      buttonTextColor = '#ffffff',
      inputHeight = 48,
      inputPadding = { top: 12, right: 16, bottom: 12, left: 16 },
    } = config;

    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const lastValidationStateRef = useRef<boolean | null>(null);
    const onValidationChangeRef = useRef(onValidationChange);

    // Atualizar ref quando onValidationChange mudar
    useEffect(() => {
      onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    // Validar formulário completo
    const isFormValid = (): boolean => {
      return fields.every((field: any) => {
        const value = values[field.id] || '';
        const error = validateField(field, value);
        return !error;
      });
    };

    // Notificar mudanças de validação (apenas quando realmente mudar)
    useEffect(() => {
      const currentIsValid = isFormValid();
      // Só notificar se o estado de validação realmente mudou
      if (lastValidationStateRef.current !== currentIsValid) {
        lastValidationStateRef.current = currentIsValid;
        if (onValidationChangeRef.current) {
          onValidationChangeRef.current(currentIsValid);
        }
      }
    }, [values, fields]); // Remover onValidationChange das dependências

    // Limpar formulário quando slide mudar
    useEffect(() => {
      if (!isActive) {
        setValues({});
        setErrors({});
        setIsSubmitted(false);
      }
    }, [isActive, element.id]);

    // Handler de mudança de campo
    const handleFieldChange = (fieldId: string, value: string) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
      
      // Limpar erro do campo ao digitar
      setErrors((prev) => ({ ...prev, [fieldId]: null }));
    };

    // Handler de blur (validar ao sair do campo)
    const handleFieldBlur = (field: any) => {
      const value = values[field.id] || '';
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field.id]: error }));
    };

    // Handler de submit
    const handleSubmit = async () => {
      // Validar todos os campos
      const newErrors: Record<string, string | null> = {};
      let hasErrors = false;

      fields.forEach((field: any) => {
        const value = values[field.id] || '';
        const error = validateField(field, value);
        newErrors[field.id] = error;
        if (error) {
          hasErrors = true;
        }
      });

      setErrors(newErrors);

      if (hasErrors) {
        toast.error('Por favor, corrija os erros no formulário');
        return;
      }

      setIsSubmitting(true);

      try {
        // Enviar para o backend
        if (reelId && slideId) {
          await api.publicPost('/responses/form', {
            reelId,
            slideId,
            elementId: element.id,
            data: values,
          });
        }

        // Chamar callback se fornecido
        if (onFormSubmit) {
          onFormSubmit(values);
        }

        setIsSubmitted(true);

        // Executar ação configurada após envio bem-sucedido
        if (buttonDestination === 'next-slide' && onNextSlide) {
          onNextSlide();
        } else if (buttonDestination === 'url' && buttonUrl) {
          let finalUrl = buttonUrl.trim();
          if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = `https://${finalUrl}`;
          }
          try {
            const urlObj = new URL(finalUrl);
            if (buttonOpenInNewTab) {
              window.open(urlObj.href, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = urlObj.href;
            }
          } catch (error) {
            if (buttonOpenInNewTab) {
              window.open(finalUrl, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = finalUrl;
            }
          }
        } else if (buttonDestination === 'success') {
          // Aguardar a animação de fade out do formulário antes de mostrar sucesso
          setTimeout(() => {
            setShowSuccess(true);
          }, 300);
        }
      } catch (error: any) {
        toast.error('Erro ao enviar formulário: ' + (error.message || 'Erro desconhecido'));
      } finally {
        setIsSubmitting(false);
      }
    };

    // Expor métodos via ref - precisa estar depois de handleSubmit
    useImperativeHandle(ref, () => ({
      isFormValid,
      submitForm: handleSubmit,
      getFormData: () => values,
    }));

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: `${gap}px`,
      width: '100%',
      position: 'relative',
      zIndex: 10,
      pointerEvents: 'auto',
      paddingTop: '24px',
      paddingBottom: '24px',
    };

    const inputStyle = (fieldId: string, hasError: boolean): React.CSSProperties => ({
      width: '100%',
      height: fieldId && fields.find((f: any) => f.id === fieldId)?.type === 'textarea' 
        ? `${inputHeight * 2}px` 
        : `${inputHeight}px`,
      padding: `${inputPadding.top}px ${inputPadding.right}px ${inputPadding.bottom}px ${inputPadding.left}px`,
      backgroundColor,
      color: textColor,
      border: `1px solid ${hasError ? '#ef4444' : borderColor}`,
      borderRadius: `${borderRadius}px`,
      fontSize: '14px',
      outline: 'none',
      fontFamily: 'inherit',
      resize: 'vertical',
      pointerEvents: 'auto',
      zIndex: 10,
      position: 'relative',
    });

    const buttonStyle: React.CSSProperties = {
      width: '100%',
      height: `${inputHeight}px`,
      backgroundColor: buttonBackgroundColor,
      color: buttonTextColor,
      border: 'none',
      borderRadius: `${borderRadius}px`,
      fontSize: '14px',
      fontWeight: 500,
      cursor: isSubmitting ? 'wait' : 'pointer',
      marginTop: `${gap}px`,
      opacity: isSubmitting ? 0.7 : 1,
      transition: 'opacity 0.2s',
    };

    // Animação de sucesso
    if (showSuccess) {
      return (
        <div style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          animation: 'fadeIn 0.3s ease-in-out',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            animation: 'scaleIn 0.5s ease-out',
          }}>
            <CheckCircle2 
              size={64} 
              style={{
                color: '#10b981',
                animation: 'bounceIn 0.6s ease-out',
              }}
            />
            <p style={{
              fontSize: '18px',
              fontWeight: 600,
              color: textColor,
              margin: 0,
            }}>
              Formulário enviado com sucesso!
            </p>
          </div>
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes scaleIn {
              from {
                transform: scale(0);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes bounceIn {
              0% {
                transform: scale(0);
                opacity: 0;
              }
              50% {
                transform: scale(1.2);
              }
              70% {
                transform: scale(0.9);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      );
    }

    if (fields.length === 0) {
      return (
        <div style={containerStyle}>
          <div style={{ ...inputStyle('', false), display: 'flex', alignItems: 'center', justifyContent: 'center', color: placeholderColor }}>
            Nenhum campo configurado
          </div>
        </div>
      );
    }

    return (
      <div style={{
        ...containerStyle,
        opacity: isSubmitted && buttonDestination === 'success' ? 0 : 1,
        transform: isSubmitted && buttonDestination === 'success' ? 'scale(0.9)' : 'scale(1)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        pointerEvents: isSubmitted && buttonDestination === 'success' ? 'none' : 'auto',
      }}>
        {fields.map((field: any, index: number) => {
          const fieldValue = values[field.id] || '';
          const fieldError = errors[field.id];
          const hasError = !!fieldError;

          return (
            <div key={field.id || index} style={{ width: '100%', pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
              {!hideTitles && (
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: textColor,
                  }}
                  htmlFor={`form-field-${field.id}`}
                >
                  {field.title || `Campo ${index + 1}`}
                  {field.required && (
                    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                  )}
                </label>
              )}
              {field.type === 'textarea' ? (
                <textarea
                  id={`form-field-${field.id}`}
                  style={inputStyle(field.id, hasError)}
                  value={fieldValue}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => handleFieldBlur(field)}
                  placeholder={field.placeholder || ''}
                  disabled={isSubmitting || isSubmitted}
                  rows={3}
                />
              ) : (
                <input
                  id={`form-field-${field.id}`}
                  type={field.type || 'text'}
                  style={inputStyle(field.id, hasError)}
                  value={fieldValue}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => handleFieldBlur(field)}
                  placeholder={field.placeholder || ''}
                  disabled={isSubmitting || isSubmitted}
                />
              )}
              {hasError && (
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
        <button
          style={buttonStyle}
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitted}
        >
          {isSubmitting ? 'Enviando...' : buttonTitle}
        </button>
      </div>
    );
  }
);

ReelFormComponent.displayName = 'ReelForm';

export const ReelForm = memo(ReelFormComponent);

