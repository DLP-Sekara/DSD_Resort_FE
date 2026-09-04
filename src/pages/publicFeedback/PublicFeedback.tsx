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
import guestReviewMutation from '../../mutations/guestReview.mutation';
import mealMutation from '../../mutations/meal.mutation';
import type { GuestReviewDTO } from '../../types/guestReview.interfaces';

const { TextArea } = Input;
const { Option } = Select;

const PublicFeedback: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form] = Form.useForm();
  
  const { addGuestReviewMutation } = guestReviewMutation();
  const { mutate: addGuestReview, isPending } = addGuestReviewMutation();

  const { getAllFoodItemsMutation } = mealMutation();
  const { data: foodItemsResponse, isLoading: isFoodLoading } = getAllFoodItemsMutation();
  const foodItems = foodItemsResponse?.data || [];

  const onFinish = (values: any) => {
    console.log('Feedback submitted:', values);
    const payload: GuestReviewDTO = {
      guestId: null,
      resId: null,
      orderId: null,
      reviewText: values.feedbackText,
      nlpScore: null,
      sentimentLabel: null,
      starRating: values.rating,
      date: values.date.format('YYYY.MM.DD'),
      food_items: values.dishesBought || [],
      members: values.staffMention ? [values.staffMention] : [],
    };

    addGuestReview(payload, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
    });
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
            label={<span className="font-bold text-[#0F2942]">Dishes Enjoyed</span>}
          >
            <Select
              mode="multiple"
              placeholder="Select dishes"
              size="large"
              className="rounded-xl"
              allowClear
              loading={isFoodLoading}
            >
              {foodItems.map((dish: any) => (
                <Option key={dish.itemId || dish.name} value={dish.name}>{dish.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="staffMention"
            label={<span className="font-bold text-[#0F2942]">Mention Staff Members (Optional)</span>}
          >
            <Input placeholder="E.g., John Doe" size="large" className="rounded-xl" />
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
              loading={isPending}
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
