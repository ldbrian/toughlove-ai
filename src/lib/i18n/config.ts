// src/lib/i18n/config.ts
import { LangType } from '@/types';

interface LanguageOption {
  code: LangType;
  nativeName: string; // 本地语言名称 (如 "日本語")
  flag: string;       // Emoji 国旗
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'tw', nativeName: '繁體中文', flag: '🇭🇰' }, // 或 🇹🇼
  { code: 'en', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
];