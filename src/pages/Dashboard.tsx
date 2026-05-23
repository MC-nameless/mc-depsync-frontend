import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Input, Card, Row, Col, Typography, Space, message, Tag } from 'antd';
import { PlusOutlined, LogoutOutlined, CodeSandboxOutlined } from '@ant-design/icons';
import { fetchWithAuth } from '../api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const [packs, setPacks] = useState<any[]>([]);
  const [newPackName, setNewPackName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadPacks = async () => {
    const res = await fetchWithAuth('/modpacks');
    if (res.ok) setPacks(await res.json());
  };

  useEffect(() => { loadPacks(); }, []);

  const handleCreate = async () => {
    if (!newPackName.trim()) return message.warning('请输入整合包名称');
    setLoading(true);
    const res = await fetchWithAuth('/modpacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPackName })
    });
    setLoading(false);
    
    if (res.ok) {
      message.success('创建成功！');
      setNewPackName('');
      loadPacks();
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}><CodeSandboxOutlined /> 我的整合包</Title>
        <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>退出登录</Button>
      </Header>
      
      <Content style={{ padding: '50px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Card style={{ marginBottom: 24 }}>
          <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
            <Input 
              placeholder="输入新整合包名称..." 
              value={newPackName} 
              onChange={e => setNewPackName(e.target.value)} 
              onPressEnter={handleCreate}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={loading}>
              新建
            </Button>
          </Space.Compact>
        </Card>

        <Row gutter={[16, 16]}>
          {packs.map(pack => (
            <Col xs={24} sm={12} md={8} key={pack.id}>
              <Card 
                hoverable 
                title={pack.name}
                extra={<Tag color="blue">v{pack.latest_version}</Tag>}
                onClick={() => navigate(`/manager/${pack.id}`)}
              >
                <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>ID: {pack.id}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>
    </Layout>
  );
}