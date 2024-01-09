import { Radio } from "@arco-design/web-react";
const RadioGroup = Radio.Group;

const Log = () => {
    return (
        <div className="p-4">
            <div className="flex">
                <RadioGroup
                    className="ml-auto"
                    type="button"
                    name="lang"
                    defaultValue="Guangzhou"
                    style={{ marginRight: 20, marginBottom: 20 }}
                >
                    <Radio value="Beijing">所有</Radio>
                    <Radio value="Shanghai">文本</Radio>
                    <Radio value="Guangzhou">图片</Radio>
                    <Radio value="Shenzhen">文件</Radio>
                </RadioGroup>
            </div>
        </div>
    );
};

export default Log;
