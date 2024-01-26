import { FC } from "react";
import { useAtom } from "jotai";
import {
    Avatar,
    Button,
    List,
    Notification,
    Radio,
    Select,
} from "@arco-design/web-react";
import {
    IconEdit,
    IconDelete,
    IconDown,
    IconLoading,
} from "@arco-design/web-react/icon";

import { clipboardStorageStore } from "../../store";
import { writeText } from "tauri-plugin-clipboard-api";

const RadioGroup = Radio.Group;

const render = (actions, item, index) => (
    <List.Item key={index} actions={actions}>
        <List.Item.Meta
            avatar={<Avatar shape="square">{item.value?.[0]}</Avatar>}
            title={item.value}
        />
    </List.Item>
);

const History: FC = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStorageStore);
    const handleClearClipboard = () => {
        setClipboard([]);
        Notification.success({
            title: "清除复制记录成功",
            content: "",
        });
    };

    const handleDelete = (index: number) => {
        setClipboard([
            ...clipboard.slice(0, index),
            ...clipboard.slice(index + 1, clipboard.length - 1),
        ]);
    };
    return (
        <div className="p-4" style={{ background: "var(--color-bg-1)" }}>
            <div className="flex">
                <RadioGroup
                    className="mr   -auto"
                    type="button"
                    name="lang"
                    defaultValue="0"
                    style={{ marginRight: 20, marginBottom: 20 }}
                >
                    <Radio value="0">所有</Radio>
                    <Radio value="1">发送</Radio>
                    <Radio value="2">接收</Radio>
                    {/* <Radio value="Shanghai">文本</Radio>
                    <Radio value="Guangzhou">图片</Radio>
                    <Radio value="Shenzhen">文件</Radio> */}
                </RadioGroup>

                <div className=" ml-auto ">
                    复制类型:
                    <Select
                        placeholder="Please select"
                        style={{ width: 154 }}
                        defaultValue={"所有"}
                        onChange={
                            (value) => {}
                            // Message.info({
                            //     content: `You select ${value}.`,
                            //     showIcon: true,
                            // })
                        }
                    >
                        {["所有", "文本", "文件", "图片"].map(
                            (option, index) => (
                                <Select.Option
                                    key={option}
                                    // disabled={index === 3}
                                    value={option}
                                >
                                    {option}
                                </Select.Option>
                            )
                        )}
                    </Select>
                    {/* <Button type="primary">所有</Button>
                    <Button type="primary">文本</Button>
                    <Button type="primary">图片</Button>
                    <Button type="primary">文件 </Button> */}
                </div>
                {/* <RadioGroup
                    className="mr   -auto"
                    type="button"
                    name="lang"
                    defaultValue="Guangzhou"
                    style={{ marginRight: 20, marginBottom: 20 }}
                >
                    <Radio value="Beijing">所有</Radio>
                    <Radio value="Shanghai">文本</Radio>
                    <Radio value="Guangzhou">图片</Radio>
                    <Radio value="Shenzhen">文件</Radio>
                </RadioGroup> */}
                <Button
                    className=" ml-4"
                    type="secondary"
                    onClick={handleClearClipboard}
                >
                    清除复制记录
                </Button>
            </div>

            <List
                size="small"
                header="复制记录"
                dataSource={clipboard}
                render={(item, index) => (
                    <List.Item
                        // style={{ textAlign: "left" }}

                        key={index}
                    >
                        <div className="flex">
                            <div> {item.value}</div>

                            <span className="list-demo-actions-icon ml-auto">
                                <IconDelete
                                    className=" cursor-pointer "
                                    onClick={() => handleDelete(index)}
                                />
                            </span>
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default History;
