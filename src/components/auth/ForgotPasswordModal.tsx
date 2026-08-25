import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import {
  Mail,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';
import authMutation from '../../mutations/auth.mutation';
import CustomButton from '../common/CustomButton';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);

  const [emailForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  const {
    sendForgotPasswordOtpMutation,
    verifyForgotPasswordOtpMutation,
    resetPasswordMutation,
  } = authMutation();

  const { mutateAsync: sendOtp, isPending: sendOtpLoading } =
    sendForgotPasswordOtpMutation();
  const { mutateAsync: verifyOtp, isPending: verifyOtpLoading } =
    verifyForgotPasswordOtpMutation();
  const { mutateAsync: resetPassword, isPending: resetPasswordLoading } =
    resetPasswordMutation();

  // Resend OTP countdown timer handler
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset modal internal state when closed
  const handleModalClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setResendTimer(0);
    emailForm.resetFields();
    otpForm.resetFields();
    resetForm.resetFields();
    onClose();
  };

  // Step 1: Send OTP
  const handleSendOtp = async (values: { email: string }) => {
    const userEmail = values.email.trim();
    const res = await sendOtp({ email: userEmail });
    if (res?.success) {
      setEmail(userEmail);
      setStep(2);
      setResendTimer(30);
    }
  };

  // Resend OTP trigger
  const handleResendOtp = async () => {
    if (resendTimer > 0 || !email) return;
    const res = await sendOtp({ email });
    if (res?.success) {
      setResendTimer(30);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (values: { otp: string }) => {
    const otpCode = values.otp.trim();
    const res = await verifyOtp({ email, otp: otpCode });
    if (res?.success) {
      setOtp(otpCode);
      setStep(3);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (values: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    const res = await resetPassword({
      email,
      otp,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });
    if (res?.success) {
      setStep(4);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={handleModalClose}
      footer={null}
      centered
      destroyOnClose
      width={460}
      className="forgot-password-modal"
      modalRender={(modalNode) => (
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
          {modalNode}
        </div>
      )}
    >
      <div className="py-2 px-1">
        {/* Step Indicator Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span className={step >= 1 ? 'text-[#F26E22]' : ''}>1. Email</span>
            <div className={`h-[2px] flex-1 mx-2 ${step >= 2 ? 'bg-[#F26E22]' : 'bg-gray-200'}`} />
            <span className={step >= 2 ? 'text-[#F26E22]' : ''}>2. Verify</span>
            <div className={`h-[2px] flex-1 mx-2 ${step >= 3 ? 'bg-[#F26E22]' : 'bg-gray-200'}`} />
            <span className={step >= 3 ? 'text-[#F26E22]' : ''}>3. Reset</span>
          </div>
        </div>

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[#F26E22]">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="font-spaceGrotesk text-2xl font-bold text-[#092968]">
                Forgot Password?
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No worries! Enter your registered email and we'll send you an OTP verification code.
              </p>
            </div>

            <Form
              form={emailForm}
              layout="vertical"
              onFinish={handleSendOtp}
              requiredMark={false}
            >
              <Form.Item
                label={<span className="text-sm font-semibold text-[#0B1B3D]">Email Address</span>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address!' },
                  { type: 'email', message: 'Please enter a valid email address!' },
                ]}
              >
                <Input
                  placeholder="admin@dsdresort.com"
                  size="large"
                  prefix={<Mail className="mr-2 h-4 w-4 text-gray-400" />}
                  className="!rounded-lg py-2 hover:border-[#F26E22] focus:border-[#F26E22]"
                />
              </Form.Item>

              <CustomButton
                type="primary"
                htmlType="submit"
                size="large"
                className="mt-2 h-12 w-full !rounded-xl !border-none !bg-[#F26E22] text-base font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
                buttonName="Send OTP Code"
                loading={sendOtpLoading}
              />
            </Form>
          </div>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[#F26E22]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-spaceGrotesk text-2xl font-bold text-[#092968]">
                Verify OTP Code
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                We've sent a 6-digit code to{' '}
                <span className="font-semibold text-[#0B1B3D]">{email}</span>
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-1 text-xs font-semibold text-[#F26E22] underline hover:text-[#D95C1A]"
              >
                Change email
              </button>
            </div>

            <Form
              form={otpForm}
              layout="vertical"
              onFinish={handleVerifyOtp}
              requiredMark={false}
            >
              <Form.Item
                label={<span className="text-sm font-semibold text-[#0B1B3D]">6-Digit OTP</span>}
                name="otp"
                rules={[
                  { required: true, message: 'Please input the OTP code!' },
                  { len: 6, message: 'OTP must be exactly 6 digits!' },
                ]}
              >
                <Input.OTP
                  length={6}
                  size="large"
                  className="w-full justify-between"
                  onChange={(val) => otpForm.setFieldsValue({ otp: val })}
                />
              </Form.Item>

              <div className="mb-4 flex items-center justify-between text-xs text-gray-500">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || sendOtpLoading}
                  onClick={handleResendOtp}
                  className={`flex items-center gap-1 font-semibold ${
                    resendTimer > 0 || sendOtpLoading
                      ? 'cursor-not-allowed text-gray-400'
                      : 'text-[#F26E22] hover:underline'
                  }`}
                >
                  <RotateCw className={`h-3 w-3 ${sendOtpLoading ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  size="large"
                  onClick={() => setStep(1)}
                  className="h-12 flex-1 !rounded-xl border-gray-300 text-gray-700 font-semibold hover:border-gray-400"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>

                <CustomButton
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="h-12 flex-[2] !rounded-xl !border-none !bg-[#F26E22] text-base font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
                  buttonName="Verify Code"
                  loading={verifyOtpLoading}
                />
              </div>
            </Form>
          </div>
        )}

        {/* STEP 3: RESET PASSWORD */}
        {step === 3 && (
          <div>
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-[#F26E22]">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="font-spaceGrotesk text-2xl font-bold text-[#092968]">
                Reset Password
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Please enter your new password below.
              </p>
            </div>

            <Form
              form={resetForm}
              layout="vertical"
              onFinish={handleResetPassword}
              requiredMark={false}
            >
              <Form.Item
                label={<span className="text-sm font-semibold text-[#0B1B3D]">New Password</span>}
                name="newPassword"
                rules={[
                  { required: true, message: 'Please input your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters!' },
                ]}
              >
                <Input.Password
                  placeholder="Enter new password"
                  size="large"
                  className="!rounded-lg py-2 hover:border-[#F26E22] focus:border-[#F26E22]"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-semibold text-[#0B1B3D]">Confirm Password</span>}
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Confirm new password"
                  size="large"
                  className="!rounded-lg py-2 hover:border-[#F26E22] focus:border-[#F26E22]"
                />
              </Form.Item>

              <CustomButton
                type="primary"
                htmlType="submit"
                size="large"
                className="mt-2 h-12 w-full !rounded-xl !border-none !bg-[#F26E22] text-base font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
                buttonName="Reset Password"
                loading={resetPasswordLoading}
              />
            </Form>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-spaceGrotesk text-2xl font-bold text-[#092968]">
              Password Reset Complete!
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
              Your password has been reset successfully. You can now log in using your new password.
            </p>

            <Button
              type="primary"
              size="large"
              onClick={handleModalClose}
              className="mt-6 h-12 w-full !rounded-xl !border-none !bg-[#F26E22] text-base font-bold text-white shadow-md transition-all hover:!bg-[#D95C1A]"
            >
              Back to Sign In
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;
