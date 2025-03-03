import React, { useState } from 'react';
import { Input, Button, Checkbox, Link } from '@heroui/react';
import { MdOutlineEmail, MdOutlineShield } from 'react-icons/md';
import request from '../request';
import { useAtom } from 'jotai';
import { authStore } from '../store';

export default function CallbackPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>('');
  const [auth, setAuth] = useAtom(authStore);

  // 从URL参数中获取code
  const getCodeFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
  };

  // 发送code到后端换取token
  const exchangeCodeForToken = async (code: string) => {
    setLoading(true);
    try {
      // return
      const res = await request.post('/auth/callback', { code: code });
      console.log(res);
      if (res.status === 200) {
        setAuth({ email: res.data.email, token: res.data.access_token });
      }

      // const response = await fetch('/api/auth/callback', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ code }),
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to exchange code for token');
      // }

      // const data = await response.json();
      // // 处理token，比如存储到localStorage或redux中
      // localStorage.setItem('token', data.token);
      // // 重定向到首页
      // window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const code = getCodeFromUrl();
    if (code) {
      exchangeCodeForToken(code);
    } else {
      setError('No code found in URL');
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : null}
    </div>
  );
}
