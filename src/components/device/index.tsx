import { Avatar, Listbox, ListboxItem } from '@heroui/react';
import { connectionStore } from '../../store';
import { useAtom } from 'jotai';

const Device = () => {
  const [connection, setConnection] = useAtom(connectionStore);
  console.log(connection)
  return (
    <div>
      <Listbox
        classNames={{
        //   base: 'max-w-xs',
          list: 'max-h-[300px] overflow-scroll',
        }}
        defaultSelectedKeys={['1']}
        // items={connection?.devices}
        label="Assigned to"
        selectionMode="multiple"
        // topContent={topContent}
        variant="flat"
        // onSelectionChange={setValues}
      >
        {connection?.devices
          ? connection?.devices.map(item => (
              <ListboxItem key={item.clientID} textValue={item.clientID}>
                <div className="flex gap-2 items-center">
              <Avatar
                alt={item.clientID}
                className="flex-shrink-0"
                size="sm"
                name={item.clientID?.[0]}
                // src={item.avatar}
              />
              <div className="flex flex-col">
                <span className="text-small">{item.clientID}</span>
                {/* <span className="text-tiny text-default-400">{item.email}</span> */}
              </div>
            </div>
              </ListboxItem>
            ))
          : null}
      </Listbox>
    </div>
  );
};

export default Device;
