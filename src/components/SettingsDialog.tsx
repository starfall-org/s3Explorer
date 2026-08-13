"use client";

import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CacheManager from '@/components/CacheManager';
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
import { ConnectionModeSelector } from '@/components/ConnectionModeSelector';
import { ConnectionMode, CONNECTION_MODE_COOKIE } from '@/utils/s3Types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const SettingsDialog = ({ open, onOpenChange, onSaved }: SettingsDialogProps) => {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState(() => Cookies.get('s3Endpoint') || '');
  const [apikey, setApikey] = useState(() => Cookies.get('s3Apikey') || '');
  const [secretKey, setSecretKey] = useState(() => Cookies.get('s3SecretKey') || '');
  const [bucket, setBucket] = useState(() => Cookies.get('s3Bucket') || '');
  const [mode, setMode] = useState<ConnectionMode>(() =>
    Cookies.get(CONNECTION_MODE_COOKIE) === 'server' ? 'server' : 'browser'
  );
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

    // Keep the same persistent cookie policy as the login page. The explicit
    // path also makes logout reliably remove the cookies again.
    const cookieOptions = {
      expires: 30,
      path: '/',
      sameSite: 'lax' as const,
      secure: window.location.protocol === 'https:',
    };

    Cookies.set('s3Endpoint', endpoint.trim(), cookieOptions);
    Cookies.set('s3Apikey', apikey.trim(), cookieOptions);
    Cookies.set('s3SecretKey', secretKey, cookieOptions);
    Cookies.set('s3Bucket', bucket.trim(), cookieOptions);
    Cookies.set(CONNECTION_MODE_COOKIE, mode, cookieOptions);
    toast({
      title: 'Saved',
      description: 'Connection settings have been updated.',
    });
    onSaved?.();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const items = await listS3Objects('', buildConfig(), mode);
      if (items.length === 0) {
        setTestResult({
          ok: true,
          message: 'Connection successful! The bucket is empty or has no files in the root folder.',
        });
      } else {
        setTestResult({
          ok: true,
          message: `Connection successful! Found ${items.length} items.`,
        });
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setTestResult({
        ok: false,
        message: 'Connection failed. Please check the endpoint and credentials.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    const cookieOptions = { path: '/' };
    Cookies.remove('s3Endpoint', cookieOptions);
    Cookies.remove('s3Apikey', cookieOptions);
    Cookies.remove('s3SecretKey', cookieOptions);
    Cookies.remove('s3Bucket', cookieOptions);
    Cookies.remove(CONNECTION_MODE_COOKIE, cookieOptions);
    router.push('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your S3 connection and media cache.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="cache">Media Cache</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4 pt-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <ConnectionModeSelector value={mode} onChange={setMode} />
          </div>

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
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
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
              <AlertTitle>{testResult.ok ? 'Success' : 'Failure'}</AlertTitle>
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
              {testing ? 'Testing…' : 'Test Connection'}
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>

        <div className="border-t pt-4">
          <Button
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out / Clear Saved Info
          </Button>
        </div>
          </TabsContent>

          <TabsContent value="cache" className="pt-4">
            <CacheManager />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
