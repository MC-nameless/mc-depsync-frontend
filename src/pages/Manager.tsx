import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Upload, List, Typography, Space, message, Popconfirm } from 'antd';
import { InboxOutlined, DeleteOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { fetchWithAuth } from '../api';

const { Content } = Layout;
const { Title } = Typography;
const { Dragger } = Upload;

export default function Manager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mods, setMods] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadMods = async () => {
    const res = await fetchWithAuth(`/modpacks/${id}/mods`);
    if (res.ok) setMods(await res.json());
  };

  useEffect(() => { loadMods(); }, [id]);

  const customUploadRequest = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth(`/modpacks/${id}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        onSuccess("ok");
        message.success(`${file.name} 上传成功`);
        loadMods();
      } else {
        onError(new Error("上传失败"));
        message.error(`${file.name} 上传失败`);
      }
    } catch (err) {
      onError(err);
    }
  };

  const handleDelete = async (filename: string) => {
    const res = await fetchWithAuth(`/modpacks/${id}/mods/${filename}`, { method: 'DELETE' });
    if (res.ok) {
      message.success('删除成功');
      loadMods();
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    const res = await fetchWithAuth(`/modpacks/${id}/manifest/generate`, { method: 'POST' });
    if (res.ok) {
      message.success('新版本发布成功！客户端现可同步更新。');
    } else {
      message.error('发布失败');
    }
    setIsPublishing(false);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ background: '#fff', padding: '16px 50px', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')}>返回大厅</Button>
          <Title level={4} style={{ margin: 0, marginLeft: 16 }}>模组管理 (ID: {id})</Title>
        </Space>
      </div>

      <Content style={{ padding: '24px 50px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={5}>暂存区管理</Title>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={handlePublish} 
            loading={isPublishing}
            style={{ backgroundColor: '#52c41a' }}
          >
            生成并发布新版本
          </Button>
        </div>

        {/* 拖拽上传区域 */}
        <div style={{ marginBottom: 24, background: '#fff', padding: 24, borderRadius: 8 }}>
          <Dragger 
            multiple 
            accept=".jar,.zip" 
            customRequest={customUploadRequest}
            showUploadList={false}
            isImageUrl={() => false}
            previewFile={() => Promise.resolve('')}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text">点击或将 Mod 文件 (.jar) 拖拽到此处</p>
            <p className="ant-upload-hint">支持批量上传，上传完毕后请记得点击右上角发布新版本。</p>
          </Dragger>
        </div>

        {/* 已上传文件列表 */}
        <div style={{ background: '#fff', padding: '0 24px 24px', borderRadius: 8 }}>
          <List
            header={<b>已上传文件 ({mods.length})</b>}
            dataSource={mods}
            locale={{ emptyText: '暂无上传的模组' }}
            renderItem={item => (
              <List.Item
                actions={[
                  <Popconfirm title="确定要删除这个模组吗？" onConfirm={() => handleDelete(item)} okText="确定" cancelText="取消">
                    <Button danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>
                ]}
              >
                <Typography.Text code>{item}</Typography.Text>
              </List.Item>
            )}
          />
        </div>
      </Content>
    </Layout>
  );
}