import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
          className="flex items-center gap-2 h-auto py-2 px-3 hover:bg-slate-100"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`${getAvatarColor()} text-white font-semibold`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium text-slate-900">{user.name}</span>
            <span className="text-xs text-slate-500 capitalize">{user.role}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {user.role === "patient" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/patient/portal")}>
              <User className="mr-2 h-4 w-4" />
              <span>My Portal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/messages")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/my-doctors")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>My Doctors</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/patient/subscription")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </DropdownMenuItem>
          </>
        )}
        
        {user.role === "clinician" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/clinician/dashboard")}>
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/patients")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>My Patients</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/messages")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/clinician/subscription")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </DropdownMenuItem>
          </>
        )}
        
        {user.role === "admin" && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/admin/dashboard")}>
              <User className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/admin/users")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Manage Users</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
