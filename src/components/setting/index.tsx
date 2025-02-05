import { Button, Form, Input, Select, SelectItem } from '@heroui/react';
import { authStore, settingStore } from '../../store';
import { useAtom } from 'jotai';
import { ToastContainer, toast } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const themes = [
  { key: 'light', label: 'light' },
  { key: 'dark', label: 'dark' },
];

const languages = [
  { key: 'zh-cn', label: '简体中文' },
  { key: 'en', label: 'english' },
];

const Setting = () => {
  const [setting, updateSetting] = useAtom(settingStore);
  const themeRef = useRef<HTMLSelectElement>(null);
  const settingRef = useRef<HTMLSelectElement>(null);
  const [auth, setAuth] = useAtom(authStore);

  const { t, i18n } = useTranslation();
  console.log(i18n.language)

  const [draftSetting, setDraftSetting] = useState<SettingAtom>(setting);

  useEffect(() => {
    setDraftSetting(setting);
  }, [setting]);

  const handleSave = () => {
    toast('保存成功');
    updateSetting(setting => ({
      ...setting,
      theme: (themeRef.current?.value as Theme) || 'light',
      language: (settingRef.current?.value ) || 'zh-cn'
    }));
  };
  const handleLogout = () => {
    setAuth(undefined);
    // console.log("退出登录");
  };
  return (
    <div className="w-full h-full flex flex-col">
      <Form>
        <Input
          className="max-w-xs"
          type="text"
          label="登录方式"
          readOnly
          value={auth?.email ?? '未登录'}
        />
        {auth?.email && (
          <Button color="danger" onPress={handleLogout}>
            退出登录
          </Button>
        )}
        <Select
          className="max-w-xs"
          label={t('pages.setting.theme.label')}
          ref={themeRef}
          selectedKeys={[draftSetting.theme]}
          onChange={e => {
            setDraftSetting(draftSetting => ({
              ...draftSetting,
              theme: e.target.value as Theme,
            }));
          }}
        >
          {themes.map(theme => (
            <SelectItem key={theme.key}>{theme.label}</SelectItem>
          ))}
        </Select>
        <Select onChange={e => {
            setDraftSetting(draftSetting => ({
              ...draftSetting,
              language: e.target.value as string,
            }));
          }} selectedKeys={[draftSetting.language]} ref={settingRef} className="max-w-xs" label={t('pages.setting.language.label')}>
          {languages.map(language => (
            <SelectItem key={language.key}>{language.label}</SelectItem>
          ))}
        </Select>
      </Form>
      <div className="flex justify-end">
        <Button
          className="ml-auto mr-4  w-10"
          color="primary"
          onPress={handleSave}
        >
          保存
        </Button>
        <Button className=" mr-4  w-10" color="default" onPress={handleSave}>
          重置
        </Button>
      </div>
    </div>
  );
};

export default Setting;
