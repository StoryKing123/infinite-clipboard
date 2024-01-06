import {
    Form,
    Input,
    Button,
    Checkbox,
    Radio,
    Tabs,
    Typography,
    Layout,
    Menu,
    Notification,
} from "@arco-design/web-react";
import { FC } from "react";
import { useAtom } from "jotai";
import { configStorageStore } from "../../store";
import History from "./history";
const FormItem = Form.Item;
const Sider = Layout.Sider;
const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const TabPane = Tabs.TabPane;

const style = {
    textAlign: "center",
    marginTop: 20,
} as any;
type FormData = { port: number };
const GeneralSetting: FC = () => {
    // const [config] = useAtom(configAtom);
    const [config, setConfig] = useAtom(configStorageStore);
    console.log(config);
    const [form] = Form.useForm<FormData>();
    const handleSubmit = (values: FormData) => {
        console.log(values);
        Notification.success({
            title: "保存成功",
            content: "This is a success Notification!",
        });
        setConfig(async () => ({ ...config, port: values.port }));
    };

    if (!config) {
        return <></>;
    }
    return (
        <Tabs defaultActiveTab="1">
            <TabPane key="1" title="通用设置">
                <Typography.Paragraph style={style}>
                    {/* <Button type="primary">Hello Arco</Button>, */}
                    <Form<{ port: number }>
                        form={form}
                        style={{ width: 600 }}
                        onSubmit={handleSubmit}
                        autoComplete="off"
                        initialValues={{ port: config.port }}
                    >
                        <FormItem
                            label="传输方式"
                            style={{ textAlign: "left" }}
                            labelAlign="right"
                            // defaultValue={"udp"}
                        >
                            <Radio.Group
                                type="button"
                                defaultValue={config?.connectType}
                            >
                                <Radio value="UDP">UDP(局域网)</Radio>
                                <Radio value="HTTP">HTTP(互联网)</Radio>
                            </Radio.Group>
                        </FormItem>
                        <FormItem label="端口" field="port">
                            <Input />
                        </FormItem>
                        <FormItem label="IP">
                            <Input placeholder="请输入ip地址，默认0.0.0.0则发送广播" />
                        </FormItem>
                        {/* <FormItem wrapperCol={{ offset: 5 }}>
                <Checkbox>I have read the manual</Checkbox>
            </FormItem> */}
                        <FormItem wrapperCol={{ offset: 5 }}>
                            <Button
                                type="primary"
                                className="mr-4"
                                htmlType="submit"
                            >
                                确认
                            </Button>
                            <Button type="secondary">重置</Button>
                        </FormItem>
                    </Form>
                    {/* <div className=" bg-slate-500">12344</div> */}
                    {/* Content of Tab Panel 1 */}
                </Typography.Paragraph>
            </TabPane>
            <TabPane key="2" title="复制记录">
                <Typography.Paragraph style={style}>
                    <History></History>
                </Typography.Paragraph>
            </TabPane>
            {/* <TabPane key="3" title="关于">
                <Typography.Paragraph style={style}>
                    Content of Tab Panel 3
                </Typography.Paragraph>
            </TabPane> */}
        </Tabs>
    );
};

export default GeneralSetting;
