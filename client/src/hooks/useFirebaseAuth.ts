import { useState } from 'react';
import { signInWithPopup, UserCredential } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useFirebaseAuth(role: 'patient' | 'clinician', language: 'en' | 'ar' = 'en') {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuth();
  
  const verifyTokenMutation = trpc.oauth.verifyFirebaseToken.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user as any);
      toast.success(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Verify with backend
      await verifyTokenMutation.mutateAsync({
        idToken,
        provider: 'google',
        role,
        email: user.email || '',
        name: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info(language === 'ar' ? 'تم إلغاء تسجيل الدخول' : 'Sign-in cancelled');
      } else {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول بواسطة Google' : 'Google sign-in failed');
      }
      setIsLoading(false);
    }
  };



  const signInWithApple = async () => {
    setIsLoading(true);
    try {
      const result: UserCredential = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Verify with backend
      await verifyTokenMutation.mutateAsync({
        idToken,
        provider: 'apple',
        role,
        email: user.email || '',
        name: user.displayName || '',
        photoURL: user.photoURL || undefined,
      });
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info(language === 'ar' ? 'تم إلغاء تسجيل الدخول' : 'Sign-in cancelled');
      } else {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول بواسطة Apple' : 'Apple sign-in failed');
      }
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    isLoading,
  };
}
