// TODO

INSERT INTO pdf_files (
  grade,
  subject,
    name,
    nickname,
    url,
    description,
    status,
    size,
    download_count,
    created_at,
    updated_at
  ) VALUES (
    1,
    'math',
    '[name]',
    '[name]',
    'https://ycy88.com/pdf/0917/[name].pdf',
    '网上资料，仅供个人使用，严禁商用！',
    'enabled',
    1024000,
    1,
    NOW(),
    NOW()
  );