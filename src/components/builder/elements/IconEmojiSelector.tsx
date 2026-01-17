import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface IconEmojiSelectorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'emoji' | 'icon' | 'both'; // Controla qual aba mostrar
}

// Lista expandida de emojis organizados por categoria
const EMOJIS = [
  // Expressões e faces
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '😵‍💫', '🤯', '🤠', '🥳', '😎',
  '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
  '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾',
  '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  
  // Gestos e pessoas
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
  '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
  '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
  '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
  '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋',
  '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯',
  
  // Objetos e símbolos
  '⭐', '🌟', '✨', '💫', '💥', '💢', '💦', '💨', '🕳️', '💣',
  '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋',
  '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
  '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
  '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾',
  
  // Comida e bebida
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇',
  '🥞', '🧈', '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙',
  '🥪', '🌮', '🌯', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱',
  '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢',
  '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭',
  '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼',
  '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂',
  '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️',
  '🥢', '🍽️', '🥄', '🔪', '🏺',
  
  // Atividades e esportes
  '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
  '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🏹', '🎣',
  '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂',
  '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄',
  '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉',
  '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰',
  '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸',
  '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🚗',
  
  // Viagem e lugares
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
  '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼',
  '🚁', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛸', '🚂',
  '🚆', '🚇', '🚊', '🚉', '🚞', '🚋', '🚃', '🚟', '🚠', '🚡',
  '⛰️', '🏔️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️',
  '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤',
  '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰',
  '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲',
  '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️',
  
  // Símbolos e objetos diversos
  '💎', '🔮', '🪄', '🧿', '🪬', '🔯', '🪯', '🛐', '⚛️', '🕉️',
  '☸️', '☮️', '☯️', '✡️', '☪️', '✝️', '☦️', '🛑', '⛎', '♈',
  '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒',
  '♓', '🆔', '⚧️', '⚕️', '☢️', '☣️', '📛', '🔰', '⭕', '✅',
  '☑️', '✔️', '❌', '❎', '➖', '➕', '➗', '✖️', '💯', '➰',
  '➿', '〽️', '✳️', '✴️', '❇️', '‼️', '⁉️', '❓', '❔', '❕',
  '❗', '〰️', '💱', '💲', '🔱', '🔰', '🔟', '🔢', '🔠', '🔡',
  '🔤', '🆎', '🆑', '🆒', '🆓', '🆔', '🆕', '🆖', '🆗', '🆘',
  '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈲',
  '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵', '🔴', '🟠',
  '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸',
  '🔹', '🔺', '🔻', '💠', '🔘', '🔳', '🔲', '▪️', '▫️', '◾',
  '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛',
  '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢',
  '💬', '💭', '🗯️', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴',
  '🎭', '🖼️', '🎨', '🧩', '♟️', '🧸', '🪅', '🪆', '🪡', '🪢',
  '🧵', '🧶', '🪴', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶️', '🌷',
  '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '☘️', '🍀',
  '🍁', '🍂', '🍃', '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍',
  '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅',
  '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬',
  '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥨', '🥯',
  '🥖', '🧀', '🥚', '🍳', '🥘', '🥣', '🥗', '🍿', '🧈', '🧂',
  '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢',
  '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞',
  '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰',
  '🧁', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🫖',
  '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃',
  '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪',
  '🏺', '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️',
  '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️',
  '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦',
  '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼',
  '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁',
  '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡',
  '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈',
  '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑',
  '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛',
  '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛺', '🚁',
  '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🚤', '⛵',
  '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🗿',
  '🛂', '🛃', '🛄', '🛅', '🧳', '⌚', '📱', '📲', '💻', '⌨️',
  '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼',
  '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠',
  '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛',
  '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸',
  '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🛠️', '🔧',
  '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🪛', '🧰', '🧲', '🪜',
  '⚗️', '🧪', '🧫', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹',
  '🩺', '🚪', '🛏️', '🛋️', '🚽', '🚿', '🛁', '🧴', '🧷', '🧹',
  '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️',
  '⚱️', '🗿', '🪦', '🪧', '🪪', '🏧', '🚮', '🚰', '♿', '🚹',
  '🚺', '🚻', '🚼', '🚾', '🛂', '🛃', '🛄', '🛅', '🛗', '🛟',
  '🛝', '🛞', '🛟', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓',
  '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🚁', '🛸',
  '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🚂', '🚃', '🚄',
  '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌',
  '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗',
  '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼',
  '🛴', '🚲', '🛺', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🛞', '🚨',
  '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤', '🛥️', '🛳️',
  '⛴️', '🚢', '⚓', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂',
  '💺', '🚀', '🌉', '🎠', '🎡', '🎢', '💈', '🎪', '🎭', '🩰',
  '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸',
  '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🚗',
];

// Lista expandida de ícones do Lucide React
const ICON_NAMES = [
  // Básicos
  'FileText', 'Circle', 'Layers', 'Layout', 'Code', 'Image', 'Video', 'Music', 'Timer',
  'Star', 'Heart', 'Zap', 'Target', 'Rocket', 'Lightbulb', 'Gift', 'Trophy', 'Flame', 'Sparkles',
  
  // Expressões e feedback
  'Smile', 'ThumbsUp', 'ThumbsDown', 'CheckCircle', 'XCircle', 'AlertCircle', 'Info', 'HelpCircle',
  
  // Segurança e privacidade
  'Shield', 'Lock', 'Unlock', 'Key', 'Fingerprint', 'Scan', 'QrCode',
  
  // Notificações e comunicação
  'Bell', 'BellRing', 'Mail', 'Phone', 'MessageSquare', 'Send', 'Share2',
  
  // Arquivos e documentos
  'Download', 'Upload', 'Save', 'Edit', 'Trash2', 'File', 'Folder', 'FolderOpen', 'Archive',
  'Book', 'BookOpen', 'Newspaper', 'FileCheck', 'FileX', 'FileQuestion', 'Clipboard', 'ClipboardCheck',
  'ClipboardList', 'StickyNote', 'Tag', 'Tags', 'Hash', 'AtSign',
  
  // Navegação e links
  'Link', 'Link2', 'ExternalLink', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown',
  'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
  
  // Ações básicas
  'Plus', 'Minus', 'X', 'Check', 'Search', 'Filter', 'Menu', 'Settings',
  
  // Comércio e dinheiro
  'ShoppingCart', 'CreditCard', 'DollarSign', 'TrendingUp', 'TrendingDown', 'BarChart', 'PieChart',
  'ShoppingBag', 'Package', 'Box', 'Truck', 'Receipt', 'Wallet', 'Coins', 'Banknote',
  
  // Calendário e tempo
  'Calendar', 'Clock',
  
  // Localização
  'MapPin', 'Globe',
  
  // Tecnologia
  'Wifi', 'Battery', 'Camera', 'Mic', 'Headphones', 'Smartphone', 'Tablet', 'Monitor', 'Laptop',
  'Mouse', 'Keyboard', 'Printer', 'HardDrive', 'Database', 'Server', 'Network', 'Cpu', 'MemoryStick',
  'Disc', 'Disc2', 'Radio', 'Tv', 'Gamepad2', 'Joystick',
  
  // Mídia
  'Play', 'Pause', 'SkipForward', 'SkipBack', 'Volume2', 'VolumeX',
  
  // Natureza
  'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Droplet', 'Fire', 'Leaf', 'Flower',
  'TreePine', 'Mountain', 'Waves', 'Fish', 'Bird', 'Cat', 'Dog',
  
  // Comida
  'Coffee', 'Utensils',
  
  // Lugares
  'Building', 'Building2', 'Home', 'School', 'Hospital', 'Church', 'Store',
  
  // Profissão e educação
  'Briefcase', 'BriefcaseBusiness', 'GraduationCap', 'Award', 'Medal', 'Crown', 'Gem', 'Diamond',
  
  // Visualização
  'Eye', 'EyeOff',
  
  // Jogos e entretenimento
  'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Puzzle', 'PuzzleIcon',
  
  // Transporte
  'Plane', 'Car', 'Bike', 'Train', 'Ship',
  
  // Usuários
  'User', 'Users',
];

// Função para obter o componente do ícone
const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || null;
};

export function IconEmojiSelector({ value, onChange, mode = 'both' }: IconEmojiSelectorProps) {
  const handleEmojiClick = (emoji: string) => {
    onChange(emoji);
  };

  const handleIconClick = (iconName: string) => {
    onChange(`icon:${iconName}`);
  };

  const handleRemove = () => {
    onChange('');
  };

  const isIcon = value?.startsWith('icon:');
  const iconName = isIcon ? value.replace('icon:', '') : null;
  const isEmoji = value && !isIcon && !(value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));

  // Determinar qual aba mostrar inicialmente
  const defaultTab = mode === 'emoji' ? 'emojis' : mode === 'icon' ? 'icons' : 'emojis';

  // Se mode não for 'both', renderizar diretamente sem Tabs
  if (mode === 'emoji') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-lg">
          {EMOJIS.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className={`p-2 text-xl rounded hover:bg-surface-hover transition-colors ${
                isEmoji && value === emoji ? 'bg-accent ring-2 ring-primary' : ''
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {value && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Selecionado:</Label>
              {isEmoji && <span className="text-xl">{value}</span>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'icon') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-lg">
          {ICON_NAMES.map((name) => {
            const IconComponent = getIconComponent(name);
            if (!IconComponent) return null;
            
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleIconClick(name)}
                className={`p-2 rounded hover:bg-surface-hover transition-colors flex items-center justify-center ${
                  iconName === name ? 'bg-accent ring-2 ring-primary' : ''
                }`}
                title={name}
              >
                <IconComponent className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {value && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Selecionado:</Label>
              {isIcon && iconName && (
                <div className="flex items-center gap-1">
                  {(() => {
                    const IconComponent = getIconComponent(iconName);
                    if (IconComponent) {
                      const Icon = IconComponent;
                      return (
                        <>
                          <Icon className="w-4 h-4" />
                          <span className="text-xs">{iconName}</span>
                        </>
                      );
                    }
                    return <span className="text-xs">{iconName}</span>;
                  })()}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Mode 'both' - usar Tabs normalmente
  return (
    <div className="space-y-3">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emojis">Emojis</TabsTrigger>
          <TabsTrigger value="icons">Ícones</TabsTrigger>
        </TabsList>

        <TabsContent value="emojis" className="mt-3">
          <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-lg">
            {EMOJIS.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className={`p-2 text-xl rounded hover:bg-surface-hover transition-colors ${
                  isEmoji && value === emoji ? 'bg-accent ring-2 ring-primary' : ''
                }`}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="icons" className="mt-3">
          <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-2 border rounded-lg">
            {ICON_NAMES.map((name) => {
              const IconComponent = getIconComponent(name);
              if (!IconComponent) return null;
              
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleIconClick(name)}
                  className={`p-2 rounded hover:bg-surface-hover transition-colors flex items-center justify-center ${
                  iconName === name ? 'bg-accent ring-2 ring-primary' : ''
                }`}
                  title={name}
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {value && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Selecionado:</Label>
            {isIcon && iconName && (
              <div className="flex items-center gap-1">
                {(() => {
                  const IconComponent = getIconComponent(iconName);
                  if (IconComponent) {
                    const Icon = IconComponent;
                    return (
                      <>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{iconName}</span>
                      </>
                    );
                  }
                  return <span className="text-xs">{iconName}</span>;
                })()}
              </div>
            )}
            {isEmoji && <span className="text-xl">{value}</span>}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
