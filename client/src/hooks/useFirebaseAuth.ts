import { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '@/lib/firebase';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export function useFirebaseAuth(role: 'patient' | 'clinician', language: 'en' | 'ar' = 'en') {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuth();
  
  const verifyTokenMutation = trpc.oauth.verifyFirebaseToken.useMutation({
    onSuccess: (data) => {
      setAuth(data.token, data.user as any, data.refreshToken);
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
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(language === 'ar' ? 'النطاق غير مصرح به. يرجى إضافة النطاق في Firebase Console' : 'Unauthorized domain. Please add domain in Firebase Console');
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
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error(language === 'ar' ? 'النطاق غير مصرح به. يرجى إضافة النطاق في Firebase Console' : 'Unauthorized domain. Please add domain in Firebase Console');
      } else {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول بواسطة Apple' : 'Apple sign-in failed');
      }
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Verify with backend
      await verifyTokenMutation.mutateAsync({
        idToken,
        provider: 'email',
        role,
        email: user.email || '',
        name: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || undefined,
      });
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error(language === 'ar' ? 'المستخدم غير موجود' : 'User not found');
      } else if (error.code === 'auth/wrong-password') {
        toast.error(language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        toast.error(language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email');
      } else {
        toast.error(language === 'ar' ? 'فشل تسجيل الدخول' : 'Sign-in failed');
      }
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Verify with backend (this will create the user in our database)
      await verifyTokenMutation.mutateAsync({
        idToken,
        provider: 'email',
        role,
        email: user.email || '',
        name: name || email.split('@')[0],
        photoURL: undefined,
      });
    } catch (error: any) {
      console.error('Email registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        // Email already exists - suggest login instead
        toast.error(
          language === 'ar' 
            ? 'البريد الإلكتروني مستخدم بالفعل. جرب تسجيل الدخول بدلاً من ذلك' 
            : 'Email already in use. Try logging in instead',
          { duration: 5000 }
        );
      } else if (error.code === 'auth/weak-password') {
        toast.error(language === 'ar' ? 'كلمة المرور ضعيفة جداً (8 أحرف على الأقل)' : 'Password is too weak (min 8 characters)');
      } else if (error.code === 'auth/invalid-email') {
        toast.error(language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email');
      } else {
        toast.error(language === 'ar' ? 'فشل التسجيل' : 'Registration failed');
      }
      setIsLoading(false);
    }
  };

  return {
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    registerWithEmail,
    isLoading,
  };
}
