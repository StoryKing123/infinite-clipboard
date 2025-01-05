import { Button, Form, Input, Select, SelectItem } from "@nextui-org/react";
import { settingStore } from "../../store";
import { useAtom } from "jotai";
import { ToastContainer, toast } from "react-toastify";
import { useEffect, useRef, useState } from "react";

const themes = [
  { key: "light", label: "light" },
  { key: "dark", label: "dark" },
];

const Setting = () => {
  const [setting, updateSetting] = useAtom(settingStore);
  const themeRef = useRef<HTMLSelectElement>(null);

  const [draftSetting, setDraftSetting] = useState<SettingAtom>(setting);

  useEffect(() => {
    // console.log(setting.theme);
    setDraftSetting(setting);
    // themeRef.current?.value = setting.theme;
  }, [setting]);

  const handleSave = () => {
    // console.log("save");
    // console.log(themeRef.current?.value);
    toast("保存成功");

    updateSetting((setting) => ({
      ...setting,
      theme: (themeRef.current?.value as Theme) || "light",
    }));
  };
  return (
    <div>
      <Form>
        <Input type="text" label="name" />
        <Select
          className="max-w-xs"
          label="主题"
          ref={themeRef}
          selectedKeys={[draftSetting.theme]}
          onChange={(e) => {
            setDraftSetting((draftSetting) => ({
              ...draftSetting,
              theme: e.target.value as Theme,
            }));
            // console.log(e);
            // setDraftTheme(e.target.value as Theme);
          }}
          // defaultSelectedKeys={[setting.theme]}
        >
          {themes.map((theme) => (
            <SelectItem key={theme.key}>{theme.label}</SelectItem>
          ))}
        </Select>

        <Button onPress={handleSave}>保存</Button>
      </Form>
    </div>
  );
};

export default Setting;
