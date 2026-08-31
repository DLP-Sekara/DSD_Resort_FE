import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Rate,
  Button,
  Card,
  Result,
} from 'antd';
import { MessageSquareHeart, Sparkles } from 'lucide-react';

const { TextArea } = Input;
const { Option } = Select;

// Distinct Staff Members & Food Items list (Fallback if no public API available)
const STAFF_MEMBERS_LIST = [
  'Samantha Wickramasinghe',
  'Nimal Jayasuriya',
  'Kasun Bandara',
  'Dilshan Perera',
  'Dinesh Fernando',
];

const FOOD_ITEMS_FILTER_LIST = [
  'Sea Food Rice large',
  'Devilled Lagoon Prawns with Fried Rice',
  'Grilled Herb Butter Reef Fish',
  'Spaghetti Carbonara (Regular)',
  'Spicy Chicken Curry with Basmati',
  'Sri Lankan String Hoppers with Kiri Hodi',
];

const PublicFeedback: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Feedback submitted:', values);
    // TODO: Send data to actual backend endpoint when ready
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-[2rem] shadow-xl border-none text-center p-6">
          <Result
            status="success"
            title={<span className="font-spaceGrotesk font-bold text-[#092968]">Thank You for Your Feedback!</span>}
            subTitle="Your response has been recorded. We value your input to improve our services."
            extra={[
              <Button
                type="primary"
                key="back"
                className="bg-[#F26E22] border-none rounded-xl font-bold h-10 px-8"
                onClick={() => {
                  form.resetFields();
                  setIsSubmitted(false);
                }}
              >
                Submit Another Response
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl rounded-[2rem] shadow-xl border-none overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#092968] p-8 text-center relative overflow-hidden -mx-6 -mt-6 mb-8">
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md mb-4 text-white">
              <MessageSquareHeart size={32} />
            </div>
            <h1 className="font-spaceGrotesk text-3xl font-black text-white mb-2">
              We Value Your Feedback
            </h1>
            <p className="text-blue-100 text-sm max-w-md flex items-center justify-center gap-1">
              <Sparkles size={14} /> Help us improve your experience
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
          className="px-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="reviewerName"
              label={<span className="font-bold text-[#0F2942]">Your Name</span>}
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input placeholder="John Doe" size="large" className="rounded-xl" />
            </Form.Item>

            <Form.Item
              name="date"
              label={<span className="font-bold text-[#0F2942]">Date of Visit</span>}
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker className="w-full rounded-xl" size="large" />
            </Form.Item>
          </div>

          <Form.Item
            name="dishesBought"
            label={<span className="font-bold text-[#0F2942]">Dishes Enjoyed (Optional)</span>}
          >
            <Select
              mode="multiple"
              placeholder="Select dishes"
              size="large"
              className="rounded-xl"
              allowClear
            >
              {FOOD_ITEMS_FILTER_LIST.map((dish) => (
                <Option key={dish} value={dish}>{dish}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="staffMention"
            label={<span className="font-bold text-[#0F2942]">Mention Staff Members (Optional)</span>}
          >
            <Select
              mode="multiple"
              placeholder="Select staff members"
              size="large"
              className="rounded-xl"
              allowClear
            >
              {STAFF_MEMBERS_LIST.map((staff) => (
                <Option key={staff} value={staff}>{staff}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="rating"
            label={<span className="font-bold text-[#0F2942]">Overall Experience</span>}
            rules={[{ required: true, message: 'Please provide a rating' }]}
          >
            <Rate className="text-amber-400 text-2xl" />
          </Form.Item>

          <Form.Item
            name="feedbackText"
            label={<span className="font-bold text-[#0F2942]">Your Feedback</span>}
            rules={[{ required: true, message: 'Please share your thoughts' }]}
          >
            <TextArea
              rows={4}
              placeholder="Tell us what you loved, or what we can do better..."
              className="rounded-xl resize-none"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6 text-center">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="w-full sm:w-auto px-12 bg-[#F26E22] hover:bg-[#D95C1A] border-none rounded-xl font-bold h-12 shadow-lg shadow-orange-200 transition-all hover:scale-105"
            >
              Submit Feedback
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PublicFeedback;
