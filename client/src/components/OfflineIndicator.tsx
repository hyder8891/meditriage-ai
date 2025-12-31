import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();

  if (isOnline) return null;

  const messages = {
    ar: 'لا يوجد اتصال بالإنترنت',
    en: 'No internet connection'
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">
        {messages[language]}
      </span>
    </div>
  );
}
