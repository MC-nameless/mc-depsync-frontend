import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Upload, List, Typography, Space, message, Popconfirm, Tag, Input } from 'antd';
import { InboxOutlined, DeleteOutlined, CheckCircleOutlined, ArrowLeftOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { fetchWithAuth } from '../api';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface ModInfo {
  name: string;
  size: number;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Manager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

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
        const data = await res.json();
        onSuccess("ok");
        if (data.status === 'skipped') {
          message.info(`[秒传]${file.name} 已存在相同的模组文件`);
        } else {
          message.success(`${file.name} 上传成功`);
        }
        loadMods();
      } else {
        const errText = await res.text();
        onError(new Error(errText));
        if (res.status === 403 && errText.includes('Quota')) {
          message.error(`[空间不足] ${file.name} 上传失败, 可用空间不足`);
        } else {
          message.error(`${file.name} 上传失败`);
        }
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

  const handleRename = async (oldName: string) => {
    if (!newFileName.trim() || newFileName === oldName) {
      setEditingFile(null);
      return;
    }
    const res = await fetchWithAuth(`/modpacks/${id}/mods/${oldName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_name: newFileName })
    });
    if (res.ok) {
      message.success('重命名成功');
      setEditingFile(null);
      loadMods();
    } else {
      message.error('重命名失败');
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
      <div style={{ background: '#fff', padding: '16px 50px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')} style={{ marginRight: 16 }}>返回大厅</Button>
        <Title level={4} style={{ margin: 0 }}>模组管理</Title>
        <div style={{ marginLeft: 24, paddingTop: 4 }}>
          {/* 一键复制 UUID */}
          <Paragraph copyable={{ text: id }} style={{ margin: 0, color: '#888' }}>
            整合包 UUID: <Text keyboard>{id}</Text>
          </Paragraph>
        </div>
      </div>

      <Content style={{ padding: '24px 50px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <Title level={5}>文件暂存区</Title>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handlePublish} loading={isPublishing} style={{ backgroundColor: '#52c41a' }}>
            生成并发布新版本
          </Button>
        </div>

        <div style={{ marginBottom: 24, background: '#fff', padding: 24, borderRadius: 8 }}>
          <Dragger 
            multiple accept=".jar,.zip" 
            customRequest={customUploadRequest} 
            showUploadList={false}
            isImageUrl={() => false}
            previewFile={() => Promise.resolve('')}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: '#1677ff' }} /></p>
            <p className="ant-upload-text">点击或将 Mod 文件 (.jar) 拖拽到此处</p>
            <p className="ant-upload-hint">支持批量上传，上传完毕后请记得点击右上角发布新版本。</p>
          </Dragger>
        </div>

        <div style={{ background: '#fff', padding: '0 24px 24px', borderRadius: 8 }}>
          <List
            header={<b>已上传文件 ({mods.length})</b>}
            dataSource={mods}
            locale={{ emptyText: '暂无上传的模组' }}
            renderItem={item => {
              const isEditing = editingFile === item.name;
              return (
                <List.Item
                  actions={isEditing ? [
                    <Button type="text" icon={<SaveOutlined />} onClick={() => handleRename(item.name)} style={{ color: '#52c41a' }} />,
                    <Button type="text" icon={<CloseOutlined />} onClick={() => setEditingFile(null)} />
                  ] : [
                    <Button type="text" icon={<EditOutlined />} onClick={() => { setEditingFile(item.name); setNewFileName(item.name); }} />,
                    <Popconfirm title="确定要删除这个模组吗？" onConfirm={() => handleDelete(item.name)} okText="确定" cancelText="取消">
                      <Button danger type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ]}
                >
                  <Space style={{ width: '100%' }}>
                    {isEditing ? (
                      <Input 
                        value={newFileName} 
                        onChange={e => setNewFileName(e.target.value)} 
                        onPressEnter={() => handleRename(item.name)}
                        style={{ width: 400 }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <Typography.Text code>{item.name}</Typography.Text>
                        <Tag color="default">{formatBytes(item.size)}</Tag>
                      </>
                    )}
                  </Space>
                </List.Item>
              );
            }}
          />
        </div>
      </Content>
    </Layout>
  );
}
