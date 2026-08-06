import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Server,
  Key,
  Lock,
  Package,
  LogOut,
  Save,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { listS3Objects, type S3Config } from '@/utils/s3Client';
import { useToast } from '@/components/ui/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const SettingsDialog = ({ open, onOpenChange, onSaved }: SettingsDialogProps) => {
  const [endpoint, setEndpoint] = useState(() => Cookies.get('s3Endpoint') || '');
  const [apikey, setApikey] = useState(() => Cookies.get('s3Apikey') || '');
  const [secretKey, setSecretKey] = useState(() => Cookies.get('s3SecretKey') || '');
  const [bucket, setBucket] = useState(() => Cookies.get('s3Bucket') || '');
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const buildConfig = (): S3Config => ({
    endpoint: endpoint.trim(),
    accessKey: apikey.trim(),
    secretKey,
    bucketName: bucket.trim(),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Cookies.set('s3Endpoint', endpoint.trim());
    Cookies.set('s3Apikey', apikey.trim());
    Cookies.set('s3SecretKey', secretKey);
    Cookies.set('s3Bucket', bucket.trim());
    toast({
      title: 'Đã lưu',
      description: 'Thông tin kết nối đã được cập nhật.',
    });
    onSaved?.();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const items = await listS3Objects('', buildConfig());
      if (items.length === 0) {
        setTestResult({
          ok: true,
          message: 'Kết nối thành công! Bucket trống hoặc không có tệp ở thư mục gốc.',
        });
      } else {
        setTestResult({
          ok: true,
          message: `Kết nối thành công! Tìm thấy ${items.length} mục.`,
        });
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setTestResult({
        ok: false,
        message: 'Kết nối thất bại. Vui lòng kiểm tra endpoint và thông tin xác thực.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('s3Endpoint');
    Cookies.remove('s3Apikey');
    Cookies.remove('s3SecretKey');
    Cookies.remove('s3Bucket');
    window.location.href = '/login';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Cài đặt kết nối S3
          </DialogTitle>
          <DialogDescription>
            Xem và quản lý thông tin xác thực S3 đã lưu trong trình duyệt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-endpoint" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Endpoint
            </Label>
            <Input
              id="settings-endpoint"
              type="text"
              placeholder="https://s3.example.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-apikey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key
            </Label>
            <Input
              id="settings-apikey"
              type="text"
              placeholder="your-access-key"
              value={apikey}
              onChange={(e) => setApikey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-secret" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Secret Key
            </Label>
            <div className="relative">
              <Input
                id="settings-secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="your-secret-key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                aria-label={showSecret ? 'Ẩn secret key' : 'Hiện secret key'}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-bucket" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Bucket
            </Label>
            <Input
              id="settings-bucket"
              type="text"
              placeholder="your-bucket-name"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
            />
          </div>

          {testResult && (
            <Alert variant={testResult.ok ? 'default' : 'destructive'}>
              <AlertTitle>{testResult.ok ? 'Thành công' : 'Thất bại'}</AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t pt-4 mt-2">
          <Button
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất / Xóa thông tin đã lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
