"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Server, Key, Package } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { ConnectionModeSelector } from '@/components/ConnectionModeSelector';
import { ConnectionMode, CONNECTION_MODE_COOKIE } from '@/utils/s3Types';

const Login = () => {
  const router = useRouter();
  const [endpoint, setEndpoint] = useState('');
  const [apikey, setApikey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [bucket, setBucket] = useState('');
  const [mode, setMode] = useState<ConnectionMode>('browser');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Use persistent first-party cookies so mobile browsers do not discard
    // the connection when the browser process/tab is closed.
    const cookieOptions = {
      expires: 365,
      path: '/',
      sameSite: 'lax' as const,
      secure: window.location.protocol === 'https:',
    };

    Cookies.set('s3Endpoint', endpoint.trim(), cookieOptions);
    Cookies.set('s3Apikey', apikey.trim(), cookieOptions);
    Cookies.set('s3SecretKey', secretKey, cookieOptions);
    Cookies.set('s3Bucket', bucket.trim(), cookieOptions);
    Cookies.set(CONNECTION_MODE_COOKIE, mode, cookieOptions);
    router.push('/');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">S3 Explorer Login</CardTitle>
          <CardDescription className="text-center">
            Enter your S3 credentials
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Endpoint
              </Label>
              <Input
                id="endpoint"
                type="text"
                placeholder="https://s3.example.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apikey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
              </Label>
              <Input
                id="apikey"
                type="text"
                placeholder="your-access-key"
                value={apikey}
                onChange={(e) => setApikey(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secretKey" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Secret Key
              </Label>
              <Input
                id="secretKey"
                type="password"
                placeholder="your-secret-key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bucket" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Bucket
              </Label>
              <Input
                id="bucket"
                type="text"
                placeholder="your-bucket-name"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                required
              />
            </div>

            <ConnectionModeSelector value={mode} onChange={setMode} />

            <p className="text-xs text-muted-foreground">
              Choose <strong>Browser</strong> if your S3 endpoint supports CORS. Choose{' '}
              <strong>Server</strong> to connect through the server proxy
              (no CORS needed).
            </p>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
