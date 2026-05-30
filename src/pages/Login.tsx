import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Tabs, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: any, mode: 'login' | 'register') => {
    setLoading(true);
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || '请求失败');
      }

      if (mode === 'login') {
        const data = await res.json();
        localStorage.setItem('jwt_token', data.token);
        message.success('登录成功，欢迎回来！');
        navigate('/dashboard');
      } else {
        message.success('注册成功！请直接登录');
      }
    } catch (err: any) {
      message.error(err.message.includes('credentials') ? '用户名或密码错误' : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <Form onFinish={(values) => handleFinish(values, 'login')} size="large">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        登 录
      </Button>
    </Form>
  );

  const registerForm = (
    <Form onFinish={(values) => handleFinish(values, 'register')} size="large">
      <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
        <Input prefix={<UserOutlined />} placeholder="新用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="设置密码" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={loading}>
        注 册 账 号
      </Button>
    </Form>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <DatabaseOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 12 }} />
          <Title level={3} style={{ margin: 0 }}>MC-Depsync 控制台</Title>
          <Text type="secondary">纯净的增量模组同步系统</Text>
        </div>
        <Tabs 
          centered 
          items={[
            { key: '1', label: '登录', children: loginForm },
            { key: '2', label: '注册', children: registerForm },
          ]} 
        />
      </Card>
    </div>
  );
}