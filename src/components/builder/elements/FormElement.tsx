import { SlideElement } from '@/contexts/BuilderContext';

// Função helper para normalizar uiConfig (pode vir como string JSON do Prisma/Redis)
const normalizeUiConfig = (uiConfig: any): any => {
  if (!uiConfig) return {};
  if (typeof uiConfig === 'string') {
    try {
      return JSON.parse(uiConfig);
    } catch {
      return {};
    }
  }
  if (typeof uiConfig === 'object' && uiConfig !== null) {
    return uiConfig;
  }
  return {};
};

interface FormElementProps {
  element: SlideElement;
}

export function FormElement({ element }: FormElementProps) {
  const config = normalizeUiConfig(element.uiConfig);
  const {
    fields = [],
    buttonEnabled = true,
    buttonTitle = 'Enviar',
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

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${gap}px`,
    width: '100%',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: `${inputHeight}px`,
    padding: `${inputPadding.top}px ${inputPadding.right}px ${inputPadding.bottom}px ${inputPadding.left}px`,
    backgroundColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: `${borderRadius}px`,
    fontSize: '14px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: `${inputHeight}px`,
    backgroundColor: buttonBackgroundColor,
    color: buttonTextColor,
    border: 'none',
    borderRadius: `${borderRadius}px`,
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: `${gap}px`,
  };

  return (
    <div style={containerStyle}>
      {fields.length === 0 ? (
        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: placeholderColor }}>
          Nenhum campo configurado
        </div>
      ) : (
        <>
          {fields.map((field: any, index: number) => (
            <div key={field.id || index} style={{ width: '100%' }}>
              {!hideTitles && (
                <label
                  style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: textColor,
                  }}
                >
                  {field.title || `Campo ${index + 1}`}
                  {field.required && (
                    <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                  )}
                </label>
              )}
              {field.type === 'textarea' ? (
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: `${inputHeight * 2}px`,
                    resize: 'vertical',
                  }}
                  placeholder={field.placeholder || ''}
                  disabled
                  rows={3}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  style={inputStyle}
                  placeholder={field.placeholder || ''}
                  disabled
                />
              )}
            </div>
          ))}
          <button style={buttonStyle} disabled>
            {buttonTitle}
          </button>
        </>
      )}
    </div>
  );
}

