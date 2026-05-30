import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Input, Card, Row, Col, Typography, Space, message, Tag, Tabs, Table, Progress, Modal, Form, Select, InputNumber } from 'antd';
import { PlusOutlined, LogoutOutlined, CodeSandboxOutlined } from '@ant-design/icons';
import { fetchWithAuth } from '../api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Dashboard() {
  const [packs, setPacks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [newPackName, setNewPackName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();

  const loadPacks = async () => {
    const res = await fetchWithAuth('/modpacks');
    if (res.ok) setPacks(await res.json());
  };

  const checkAdminAndLoadUsers = async () => {
    const res = await fetchWithAuth('/admin/users');
    if (res.ok) {
      setIsAdmin(true);
      setUsers(await res.json());
    }
  };

  useEffect(() => {
    loadPacks();
    checkAdminAndLoadUsers();
  }, []);

  const handleCreatePack = async () => {
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

  const openEditModal = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue({
      role: record.role,
      quota_gb: Number((record.quota_bytes / (1024 ** 3)).toFixed(2))
    });
    setIsModalVisible(true);
  };

  const handleUpdateUser = async (values: any) => {
    const quotaBytes = Math.floor(values.quota_gb * (1024 ** 3));
    
    const res = await fetchWithAuth(`/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: values.role, quota_bytes: quotaBytes })
    });

    if (res.ok) {
      message.success('用户信息更新成功');
      setIsModalVisible(false);
      checkAdminAndLoadUsers();
    } else {
      message.error('更新失败');
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    navigate('/');
  };

  const renderMyPacks = () => (
    <>
      <Card style={{ marginBottom: 24 }}>
        <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
          <Input 
            placeholder="输入新整合包名称..." 
            value={newPackName} 
            onChange={e => setNewPackName(e.target.value)} 
            onPressEnter={handleCreatePack}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePack} loading={loading}>
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
    </>
  );

  const renderAdminPanel = () => (
    <Card title="全站用户与容量管理">
      <Table 
        dataSource={users} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      >
        <Table.Column title="ID" dataIndex="id" width={60} />
        <Table.Column title="用户名" dataIndex="username" />
        <Table.Column 
          title="权限角色" 
          dataIndex="role" 
          render={(role) => (
            <Tag color={role === 'admin' ? 'red' : 'green'}>
              {role.toUpperCase()}
            </Tag>
          )} 
        />
        <Table.Column 
          title="空间使用情况" 
          render={(_, record: any) => {
            const percent = (record.used_bytes / record.quota_bytes) * 100;
            return (
              <div style={{ width: 250 }}>
                <Progress 
                  percent={Number(percent.toFixed(1))} 
                  status={percent >= 100 ? 'exception' : 'active'}
                  size="small"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatBytes(record.used_bytes)} / {formatBytes(record.quota_bytes)}
                </Text>
              </div>
            )
          }} 
        />
        <Table.Column 
          title="操作" 
          render={(_, record) => (
            <Button type="link" onClick={() => openEditModal(record)}>编辑配置</Button>
          )} 
        />
      </Table>
    </Card>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#fff', padding: '0 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={4} style={{ margin: 0 }}><CodeSandboxOutlined /> 云端控制中心</Title>
        <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>退出登录</Button>
      </Header>
      
      <Content style={{ padding: '30px 50px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Tabs 
          defaultActiveKey="1"
          items={[
            { key: '1', label: '我的整合包', children: renderMyPacks() },
            ...(isAdmin ? [{ key: '2', label: <span>管理员后台</span>, children: renderAdminPanel() }] : []),
          ]}
        />
      </Content>

      <Modal 
        title={`修改用户配置: ${editingUser?.username}`} 
        open={isModalVisible} 
        onOk={() => form.submit()} 
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateUser}>
          <Form.Item name="role" label="权限角色">
            <Select>
              <Select value="user">普通用户 (User)</Select>
              <Select value="admin">管理员 (Admin)</Select>
            </Select>
          </Form.Item>
          <Form.Item name="quota_gb" label="空间配额上限 (GB)" rules={[{ required: true }]}>
            <InputNumber min={0.001} max={1000} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}