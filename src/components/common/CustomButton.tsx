import { Button, ConfigProvider, type ButtonProps } from "antd";
import React from "react";
import type { ReactNode } from "react";

interface CustomButtonProps extends ButtonProps {
  buttonName: ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  buttonName,
  type = "default",
  onClick,
  ...restProps
}) => {
  const isPrimary = type === "primary";

  const themeConfig = {
    components: {
      Button: {
        defaultBg: 'transparent',
        defaultBorderColor: '#009359',
        defaultColor: '#009359',
        defaultHoverBg: '#e5f7ff',
        defaultHoverBorderColor: '#16a34a',
        defaultHoverColor: '#16a34a',
      },
    },
    token: isPrimary
      ? {
          colorPrimary: '#3A3834',
          colorPrimaryHover: '#504d48ff',
        }
      : {},
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <Button type={type} onClick={onClick} {...restProps}>
        {buttonName}
      </Button>
    </ConfigProvider>
  );
};

export default CustomButton;
