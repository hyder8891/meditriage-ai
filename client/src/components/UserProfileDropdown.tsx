import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  LogOut, 
  MessageSquare, 
  Calendar,
  FileText,
  CreditCard,
  ChevronDown
} from "lucide-react";

export function UserProfileDropdown() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  if (!user) return null;

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color based on role
  const getAvatarColor = () => {
    switch (user.role) {
      case "clinician":
        return "bg-blue-600";
      case "patient":
        return "bg-green-600";
      case "admin":
        return "bg-purple-600";
      default:
        return "bg-slate-600";
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 h-auto min-h-[44px] py-2 px-3 hover:bg-slate-100"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`${getAvatarColor()} text-white font-semibold`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">{user.name}</span>
            <span className="text-xs text-slate-500 capitalize">
              {language === 'ar' 
                ? (user.role === 'admin' ? 'مدير' : user.role === 'clinician' ? 'طبيب' : 'مريض')
                : user.role
              }
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 md:w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'المعرف' : 'ID'}: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {user.role === "patient" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/patient/portal")}>
              <User className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'بوابتي' : 'My Portal'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/messages")}>
              <MessageSquare className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'الرسائل' : 'Messages'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/my-doctors")}>
              <FileText className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'أطبائي' : 'My Doctors'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/subscription")}>
              <CreditCard className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'الاشتراك' : 'Subscription'}</span>
            </DropdownMenuItem>
          </>
        )}
        
        {user.role === "clinician" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/clinician/dashboard")}>
              <User className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/patients")}>
              <FileText className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'مرضاي' : 'My Patients'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/messages")}>
              <MessageSquare className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'الرسائل' : 'Messages'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/subscription")}>
              <CreditCard className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'الاشتراك' : 'Subscription'}</span>
            </DropdownMenuItem>
          </>
        )}
        
        {user.role === "admin" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/admin/dashboard")}>
              <User className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'لوحة المدير' : 'Admin Dashboard'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/admin/users")}>
              <FileText className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
              <span>{language === 'ar' ? 'إدارة المستخدمين' : 'Manage Users'}</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
          <span>{language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
