import { FC } from "react";
import { Typography } from "@arco-design/web-react";
const { Title, Paragraph, Text } = Typography;

const About: FC = () => {
    return (
        <div className="p-4">
            <Typography style={{ marginTop: -40 }}>
                <Title>Infinite-paste</Title>
                <Paragraph>
                    A design is a plan or specification for the construction of
                    an object or system or for the implementation of an activity
                    or process, or the result of that plan or specification in
                    the form of a prototype, product or process. The verb to
                    design expresses the process of developing a design.
                    <Text bold>to be a design activity.</Text>
                </Paragraph>

                <Paragraph>
                    <Text bold >Infinite-paste @2023 Created by firengxuan</Text>
                </Paragraph>
            </Typography>
            <div></div>
        </div>
    );
};

export default About;
