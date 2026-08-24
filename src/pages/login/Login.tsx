import { Form, Input } from 'antd';
import AdminOnBoardingLayout from '../../layout/AdminOnBoardingLayout';
import type { LoginTypes } from '../../types/onBoarding.interfaces';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../components/common/CustomButton';
import authMutation from '../../mutations/auth.mutation';

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { signInMutation } = authMutation();

  const { mutateAsync: login, isPending: loading } = signInMutation();

  const onFinish = async (value: LoginTypes) => {
    const data = {
      email: value.email,
      password: value.password,
    };
    const response = await login(data);
    console.log(response);
    if (response.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <AdminOnBoardingLayout>
      <div className="shadow-lg px-6 rounded-xl">
        <h2 className="font-spaceGrotesk text-center text-[20px] font-bold text-black md:text-[40px]">
          Ocean View Resort <br />
          Admin Portal
        </h2>
        <p className="font-regular py-5 text-center text-[16px] text-[#2F2F2F] md:text-[20px]">
          Welcome back. Please sign in to manage bookings, <br />
          rooms, and guest services efficiently.
        </p>
        <div className="flex h-full flex-col border-t pt-5">
          <Form
            form={form}
            className="flex h-full flex-col justify-between md:gap-0"
            name="signin"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <div className="flex flex-col">
              <Form.Item
                label={
                  <span className="text-[16px] font-medium text-[#3A3834]">
                    Enter your Email
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Enter a valid email!' },
                ]}
              >
                <Input
                  placeholder="Enter your Email"
                  size="large"
                  maxLength={100}
                  className="!rounded-sm"
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-[16px] font-medium text-[#3A3834]">
                    Enter Password
                  </span>
                }
                name="password"
                rules={[
                  {
                    required: true,
                    message: 'Please input your Password!',
                  },
                ]}
              >
                <Input.Password
                  className="!rounded-sm"
                  placeholder="Enter your Password"
                  size="large"
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
              
              <div className="flex flex-row justify-end">
                <span
                  className="hover:text-primary -mt-4 flex w-fit cursor-pointer justify-end text-[12px] font-medium text-[#0168FF] underline lg:text-[14px]"
                  onClick={() => navigate('/reset-password')}
                >
                  Forgot/Change PIN ?
                </span>
              </div>

              <CustomButton
                type="primary"
                htmlType="submit"
                size="large"
                className="my-6 w-full !rounded-full !bg-[#3A3834] font-semibold"
                buttonName="Login"
                loading={loading}
              />
            </div>
          </Form>
        </div>
      </div>
    </AdminOnBoardingLayout>
  );
};

export default Login;
