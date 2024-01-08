import { FC } from "react";
import { useAtom } from "jotai";
import { Button, List, Notification } from "@arco-design/web-react";
import { clipboardStorageStore } from "../../store";

const History: FC = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStorageStore);
    const handleClearClipboard = () => {
        setClipboard([]);
        Notification.success({
            title: "清除复制记录成功",
            content: "",
        });
    };

    return (
        <div>
            <div className=" mb-4 text-right">
                <Button className="ml-auto" type="secondary" onClick={handleClearClipboard}>
                    清除复制记录
                </Button>
            </div>

            <List
                // style={{ width: 622 }}
                size="small"
                header="复制记录"
                dataSource={clipboard}
                render={(item, index) => (
                    <List.Item style={{ textAlign: "left" }} key={index}>
                        {item.value}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default History;
