import React from "react";
import type { ReactNode } from "react";
import { Divider, Modal, Typography } from "antd";
import CloseOutline from "../../assets/images/svg/CloseOutline";

const { Title } = Typography;

interface ActionDialogProps {
  size?: string | number;
  modalOpen: boolean;
  handleCancel: () => void;
  title: string | ReactNode;
  children: ReactNode;
  height?: string | number;
  icon?: ReactNode;
}

const ActionDialog: React.FC<ActionDialogProps> = ({
  size,
  modalOpen,
  handleCancel,
  title,
  children,
  height,
  icon,
}) => {
  return (
    <Modal
      open={modalOpen}
      onCancel={handleCancel}
      closeIcon={false}
      className="flex flex-col rounded-md"
      width={size}
      footer={null}
      maskClosable={false}
    >
      <div className="flex items-center justify-between">
        <Title
          level={1}
          className="3xl:!text-base mt-1 flex items-center gap-2 !text-xs font-semibold md:!text-sm"
        >
          {icon}
          {title}
        </Title>
        <button className="bg-white" onClick={handleCancel}>
          <CloseOutline className="cursor-pointer" />
        </button>
      </div>
      <Divider style={{ margin: 2 }} />
      <div
        className="flex justify-center"
        style={height ? { height } : undefined}
      >
        {children}
      </div>
    </Modal>
  );
};

export default ActionDialog;
