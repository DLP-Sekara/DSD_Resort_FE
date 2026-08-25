import { useState } from 'react';
import { Form, Input } from 'antd';
import AdminOnBoardingLayout from '../../layout/AdminOnBoardingLayout';
import type { LoginTypes } from '../../types/onBoarding.interfaces';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../components/common/CustomButton';
import authMutation from '../../mutations/auth.mutation';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  const { signInMutation } = authMutation();

  const { mutateAsync: login, isPending: loading } = signInMutation();

  const onFinish = async (value: LoginTypes) => {
    const data = {
      email: value.email,
      password: value.password,
    };

    // Execute login mutation
    const response = await login(data);


    // Redirect to dashboard on successful login
    if (response.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <AdminOnBoardingLayout>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-100 bg-white px-8 py-10 shadow-xl">
        <div className="mb-8 text-center">
          <h2 className="font-spaceGrotesk text-[24px] font-extrabold leading-tight !text-[#092968] md:text-[36px]">
            DSD Resort <br />
            <span className="text-[#F26E22]">Admin Portal</span>
          </h2>
          <p className="font-regular mt-3 text-[15px] text-gray-500 md:text-[16px]">
            Welcome back. Please sign in to manage bookings, rooms, and guest services
            efficiently.
          </p>
        </div>

        {/* Form Section */}
        <div className="flex h-full flex-col pt-2">
          <Form
            form={form}
            className="flex flex-col gap-2"
            name="signin"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            {/* Email Input */}
            <Form.Item
              label={
                <span className="text-[15px] font-semibold text-[#0B1B3D]">
                  Email Address
                </span>
              }
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Enter a valid email!' },
              ]}
            >
              <Input
                placeholder="admin@dsdresort.com"
                size="large"
                maxLength={100}
                className="!rounded-lg py-2 hover:border-[#F26E22] focus:border-[#F26E22]"
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            {/* Password Input */}
            <Form.Item
              label={
                <span className="text-[15px] font-semibold text-[#0B1B3D]">Password</span>
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
                className="!rounded-lg py-2 hover:border-[#F26E22] focus:border-[#F26E22]"
                placeholder="Enter your password"
                size="large"
                onKeyDown={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            {/* Forgot Password Link */}
            <div className="mb-4 flex flex-row justify-end">
              <span
                className="flex w-fit cursor-pointer justify-end text-[13px] font-semibold text-[#0B1B3D] underline transition-colors duration-200 hover:text-[#F26E22]"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Forgot Password?
              </span>
            </div>

            {/* Submit Button */}
            <CustomButton
              type="primary"
              htmlType="submit"
              size="large"
              className="h-12 w-full !rounded-xl !border-none !bg-[#F26E22] text-[16px] font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
              buttonName="Sign In"
              loading={loading}
            />
          </Form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </AdminOnBoardingLayout>
  );
};

export default Login;
