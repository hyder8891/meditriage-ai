import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Check, Loader2 } from 'lucide-react';

export default function TestNotifications() {
  const { toast } = useToast();
  const { unreadCount, notifications, markAsRead, clearAll, requestPermission, hasPermission } = useNotifications();
  const [customMessage, setCustomMessage] = useState('');
  
  const testNotificationMutation = trpc.system.testNotification.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'تم إرسال الإشعار',
        description: `تم إرسال الإشعار عبر Redis إلى المستخدم ${data.userId}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const sendTestNotification = () => {
    testNotificationMutation.mutate({
      message: customMessage || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">اختبار نظام الإشعارات</h1>
          <p className="text-muted-foreground mt-2">
            اختبار الإشعارات الفورية عبر Socket.IO + Redis
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الاتصال</CardTitle>
            <CardDescription>معلومات الاتصال بخادم الإشعارات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">إذن المتصفح:</span>
              <div className="flex items-center gap-2">
                {hasPermission ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">ممنوح</span>
                  </>
                ) : (
                  <>
                    <Button onClick={requestPermission} size="sm" variant="outline">
                      طلب الإذن
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الإشعارات غير المقروءة:</span>
              <span className="text-sm font-bold">{unreadCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Test Notification Sender */}
        <Card>
          <CardHeader>
            <CardTitle>إرسال إشعار تجريبي</CardTitle>
            <CardDescription>
              أرسل إشعاراً تجريبياً لنفسك عبر Socket.IO + Redis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">رسالة مخصصة (اختياري)</Label>
              <Input
                id="message"
                placeholder="اكتب رسالة مخصصة أو اتركها فارغة للرسالة الافتراضية"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>
            <Button
              onClick={sendTestNotification}
              disabled={testNotificationMutation.isPending}
              className="w-full"
            >
              {testNotificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  إرسال إشعار تجريبي
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>الإشعارات المستلمة</CardTitle>
                <CardDescription>قائمة الإشعارات الواردة في الوقت الفعلي</CardDescription>
              </div>
              {notifications.length > 0 && (
                <Button onClick={clearAll} variant="outline" size="sm">
                  مسح الكل
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد إشعارات بعد</p>
                <p className="text-sm mt-1">أرسل إشعاراً تجريبياً لرؤيته هنا</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.messageId}
                    className="flex items-start justify-between p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">
                          {notification.subject || 'إشعار جديد'}
                        </span>
                      </div>
                      <p className="text-sm">{notification.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString('ar-IQ')}
                      </p>
                    </div>
                    <Button
                      onClick={() => markAsRead(notification.messageId)}
                      variant="ghost"
                      size="sm"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>كيفية الاختبار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-2">
              <li>تأكد من تسجيل الدخول إلى النظام</li>
              <li>اضغط على "طلب الإذن" للسماح بإشعارات المتصفح (اختياري)</li>
              <li>اكتب رسالة مخصصة أو اتركها فارغة</li>
              <li>اضغط على "إرسال إشعار تجريبي"</li>
              <li>يجب أن تظهر الإشعارات في:
                <ul className="list-disc list-inside mr-6 mt-1 space-y-1">
                  <li>قائمة الإشعارات أدناه</li>
                  <li>Toast notification في أعلى الشاشة</li>
                  <li>إشعار المتصفح (إذا منحت الإذن)</li>
                  <li>صوت الإشعار (إذا كان متاحاً)</li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 ملاحظة: هذا الاختبار يتحقق من أن Redis يعمل بشكل صحيح لتوزيع الإشعارات عبر خوادم متعددة.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
