import React, { useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Drawer,
  Card,
  Progress,
  Rate,
  Avatar,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  MessageSquareQuote,
  Sparkles,
  Search,
  RotateCw,
  Utensils,
  User,
  AlertTriangle,
  HeartHandshake,
  MessageCircle,
  Clock,
  TrendingUp,
  Filter,
  Trash2,
} from 'lucide-react';
import dayjs from 'dayjs';
import guestReviewMutation from '../../mutations/guestReview.mutation';

const { Option } = Select;


// ---------------------------------------------------------------------------
// INTERFACES & TYPES
// ---------------------------------------------------------------------------
export interface GuestReviewItem {
  id: string;
  reviewId: string;
  orderNumber?: string;
  reviewerName: string;
  reviewerEmail?: string;
  reviewerPhone?: string;
  roomOrTable: string;
  date: string;
  time: string;
  timestamp: string; // ISO string for date filtering
  rating: number; // 1 to 5
  aiSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  aiConfidence: number; // e.g. 96 (%)
  aiKeyTakeaway: string;
  reviewText: string;
  suggestions?: string;
  staffMember: string; // Restaurant staff / server name
  staffRole?: string;
  foodItems: {
    name: string;
    category?: string;
    itemRating?: number;
  }[];
  managerResponse?: string;
  status: 'REVIEWED' | 'NEEDS_ACTION' | 'RESOLVED';
}

const GuestFeedback: React.FC = () => {
  const { getAllGuestReviewsQuery, deleteGuestReviewMutation } = guestReviewMutation();
  const { data: response, isLoading, refetch, isRefetching } = getAllGuestReviewsQuery();
  const { mutate: deleteReview, isPending: isDeleting } = deleteGuestReviewMutation();

  const realReviews: GuestReviewItem[] = useMemo(() => {
    if (!response?.data) return [];
    const reviews = response.data.map((r: any) => {
      const formattedDate = r.date ? r.date.replace(/\./g, '-') : new Date().toISOString().split('T')[0];
      const sentimentLabelUpper = r.sentimentLabel ? r.sentimentLabel.toUpperCase() : 'NEUTRAL';
      const aiSentiment = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(sentimentLabelUpper)
        ? sentimentLabelUpper
        : 'NEUTRAL';

      const safeReviewId = String(r.reviewId || Math.random().toString(36).substring(2, 9));

      return {
        id: safeReviewId,
        reviewId: `REV-${safeReviewId.substring(0, 4).toUpperCase()}`,
        orderNumber: r.orderId || 'N/A',
        reviewerName: r.guestId ? `Guest (${r.guestId.substring(0, 4)})` : 'Anonymous Guest',
        roomOrTable: r.resId || 'General Area',
        date: formattedDate,
        time: 'N/A',
        timestamp: formattedDate,
        rating: r.starRating || 0,
        aiSentiment: aiSentiment as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
        aiConfidence: r.nlpScore ? Math.round(r.nlpScore) : 0,
        aiKeyTakeaway: r.reviewText,
        reviewText: r.reviewText || 'No review text provided.',
        suggestions: '',
        staffMember: r.members && r.members.length > 0 ? r.members.join(', ') : 'Unassigned',
        staffRole: 'Staff Member',
        foodItems: r.food_items
          ? r.food_items.map((f: string) => ({
              name: f,
              category: 'Ordered Item',
              itemRating: r.starRating,
            }))
          : [],
        status: 'REVIEWED',
      };
    });
    
    // Sort reviews by date descending (newest first)
    return reviews.sort((a: GuestReviewItem, b: GuestReviewItem) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [response]);

  const STAFF_MEMBERS_LIST = useMemo(() => {
    const staffSet = new Set<string>();
    realReviews.forEach((r) => {
      if (r.staffMember && r.staffMember !== 'Unassigned') {
        r.staffMember.split(', ').forEach((s) => staffSet.add(s));
      }
    });
    return Array.from(staffSet);
  }, [realReviews]);

  const FOOD_ITEMS_FILTER_LIST = useMemo(() => {
    const foodSet = new Set<string>();
    realReviews.forEach((r) => {
      if (r.foodItems) {
        r.foodItems.forEach((f) => foodSet.add(f.name));
      }
    });
    return Array.from(foodSet);
  }, [realReviews]);
  // ---------------------------------------------------------------------------
  // FILTER STATES
  // ---------------------------------------------------------------------------
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [selectedFoodItem, setSelectedFoodItem] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  // ---------------------------------------------------------------------------
  // DRAWER & SELECTED REVIEW STATE
  // ---------------------------------------------------------------------------
  const [selectedReview, setSelectedReview] = useState<GuestReviewItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredReviews = useMemo(() => {
    return realReviews.filter((item) => {
      // 1. Staff Filter
      if (selectedStaff !== 'ALL' && item.staffMember !== selectedStaff) {
        return false;
      }

      // 2. Food Item Filter
      if (
        selectedFoodItem !== 'ALL' &&
        !item.foodItems.some((f) => f.name.toLowerCase() === selectedFoodItem.toLowerCase())
      ) {
        return false;
      }

      // 3. Sentiment Filter
      if (selectedSentiment !== 'ALL' && item.aiSentiment !== selectedSentiment) {
        return false;
      }

      // 4. Date Filter
      if (selectedDate) {
        const itemDate = dayjs(item.timestamp);
        if (!itemDate.isSame(selectedDate, 'day')) {
          return false;
        }
      }

      // 5. Search Text Filter
      if (searchText) {
        const q = searchText.toLowerCase();
        const matchesName = item.reviewerName.toLowerCase().includes(q);
        const matchesId = item.reviewId.toLowerCase().includes(q);
        const matchesText = item.reviewText.toLowerCase().includes(q);
        const matchesStaff = item.staffMember.toLowerCase().includes(q);
        const matchesOrder = item.orderNumber?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesId && !matchesText && !matchesStaff && !matchesOrder) {
          return false;
        }
      }

      return true;
    });
  }, [realReviews, selectedStaff, selectedFoodItem, selectedSentiment, selectedDate, searchText]);

  // ---------------------------------------------------------------------------
  // SUMMARY METRICS COMPUTATION
  // ---------------------------------------------------------------------------
  const summaryMetrics = useMemo(() => {
    const total = filteredReviews.length;
    if (total === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        positivePct: 0,
        negativePct: 0,
        neutralPct: 0,
      };
    }

    const ratingSum = filteredReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((ratingSum / total).toFixed(1));

    const positive = filteredReviews.filter((r) => r.aiSentiment === 'POSITIVE').length;
    const negative = filteredReviews.filter((r) => r.aiSentiment === 'NEGATIVE').length;
    const neutral = filteredReviews.filter((r) => r.aiSentiment === 'NEUTRAL').length;

    return {
      totalReviews: total,
      averageRating: avg,
      positiveCount: positive,
      negativeCount: negative,
      neutralCount: neutral,
      positivePct: Math.round((positive / total) * 100),
      negativePct: Math.round((negative / total) * 100),
      neutralPct: Math.round((neutral / total) * 100),
    };
  }, [filteredReviews]);

  // Handle open drawer
  const handleOpenReviewDetails = (review: GuestReviewItem) => {
    setSelectedReview(review);
    setIsDrawerOpen(true);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedStaff('ALL');
    setSelectedFoodItem('ALL');
    setSelectedSentiment('ALL');
    setSelectedDate(null);
    setSearchText('');
  };

  // ---------------------------------------------------------------------------
  // TABLE COLUMNS CONFIGURATION
  // ---------------------------------------------------------------------------
  const columns: ColumnsType<GuestReviewItem> = [
    {
      title: 'Review ID',
      dataIndex: 'reviewId',
      key: 'reviewId',
      width: 120,
      render: (text: string) => (
        <span className="font-mono text-xs font-black text-[#092968] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          {text}
        </span>
      ),
    },
    {
      title: 'Guest / Reviewer',
      key: 'reviewer',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            style={{
              backgroundColor: record.aiSentiment === 'POSITIVE' ? '#10b981' : '#f43f5e',
            }}
            className="font-bold text-white uppercase text-xs shrink-0"
          >
            {record.reviewerName.charAt(0)}
          </Avatar>
          <div>
            <p className="font-bold text-[#092968] text-xs sm:text-sm leading-tight">
              {record.reviewerName}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{record.roomOrTable}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'dateTime',
      width: 150,
      render: (_, record) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-700">{dayjs(record.date).format('DD MMM YYYY')}</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Clock size={11} /> {record.time}
          </p>
        </div>
      ),
    },
    {
      title: 'AI Sentiment Sign',
      key: 'aiSentiment',
      width: 170,
      render: (_, record) => {
        if (record.aiSentiment === 'POSITIVE') {
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
              <ThumbsUp size={14} className="text-emerald-600" />
              <span>Positive ({record.aiConfidence}%)</span>
            </div>
          );
        } else if (record.aiSentiment === 'NEGATIVE') {
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
              <ThumbsDown size={14} className="text-rose-600" />
              <span>Negative ({record.aiConfidence}%)</span>
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
            <Meh size={14} className="text-amber-600" />
            <span>Neutral ({record.aiConfidence}%)</span>
          </div>
        );
      },
    },
    {
      title: 'Star Ratings',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      render: (rating: number) => (
        <div className="flex items-center gap-1.5">
          <Rate disabled defaultValue={rating} className="text-xs text-amber-400" />
          <span className="font-mono text-xs font-black text-slate-700">({rating}.0)</span>
        </div>
      ),
    },
    {
      title: 'Served By',
      dataIndex: 'staffMember',
      key: 'staffMember',
      width: 180,
      render: (staff: string) => (
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <User size={13} className="text-slate-400" />
          {staff}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: 150,
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => handleOpenReviewDetails(record)}
            className="h-8 rounded-xl px-3 font-bold text-xs text-[#092968] border-slate-200 hover:border-[#092968] hover:text-[#092968] flex items-center gap-1.5"
          >
            <MessageCircle size={14} />
            <span>View Details</span>
          </Button>
          <Popconfirm
            title="Delete this review?"
            description="Are you sure you want to permanently delete this review?"
            onConfirm={() => deleteReview(record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: isDeleting }}
            placement="topLeft"
          >
            <Button
              danger
              type="text"
              className="h-8 w-8 rounded-xl p-0 flex items-center justify-center hover:bg-rose-50"
            >
              <Trash2 size={15} />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* ----------------------------------------------------------------------- */}
      {/* PAGE HEADER */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F26E22]">
            <Sparkles size={16} />
            <span>AI-Powered Guest Experience Intelligence</span>
          </div>
          <h1 className="font-spaceGrotesk text-2xl sm:text-3xl font-black text-[#092968]">
            Guest Feedback & Restaurant Reviews
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time dining ratings, guest feedback analysis, and staff service benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleResetFilters}
            icon={<RotateCw size={14} />}
            className="h-10 rounded-xl font-bold text-xs"
          >
            Reset Filters
          </Button>
          <Button
            onClick={() => refetch()}
            loading={isRefetching}
            type="primary"
            className="h-10 rounded-xl font-bold text-xs bg-[#092968]"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* FILTERS TOOLBAR */}
      {/* ----------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#092968]">
            <Filter size={15} className="text-[#F26E22]" />
            <span>Filter Reviews & Feedback</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing <strong className="text-[#092968]">{filteredReviews.length}</strong> reviews
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Date Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
              Filter by Date
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="h-10 w-full rounded-xl"
              format="YYYY-MM-DD"
            />
          </div>

          {/* 2. Restaurant Staff Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
              Restaurant Staff Member
            </label>
            <Select
              showSearch
              placeholder="All Staff Members"
              value={selectedStaff}
              onChange={(val) => setSelectedStaff(val)}
              className="h-10 w-full rounded-xl"
            >
              <Option value="ALL">All Staff Members ({STAFF_MEMBERS_LIST.length})</Option>
              {STAFF_MEMBERS_LIST.map((staff) => (
                <Option key={staff} value={staff}>
                  {staff}
                </Option>
              ))}
            </Select>
          </div>

          {/* 3. Food Items Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
              Ordered Food Item
            </label>
            <Select
              showSearch
              placeholder="All Food Items"
              value={selectedFoodItem}
              onChange={(val) => setSelectedFoodItem(val)}
              className="h-10 w-full rounded-xl"
            >
              <Option value="ALL">All Food Items ({FOOD_ITEMS_FILTER_LIST.length})</Option>
              {FOOD_ITEMS_FILTER_LIST.map((dish) => (
                <Option key={dish} value={dish}>
                  {dish}
                </Option>
              ))}
            </Select>
          </div>

          {/* 4. Text Search Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
              Search Review Details
            </label>
            <Input
              prefix={<Search size={14} className="text-slate-400" />}
              placeholder="Search reviewer, comment, order #..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-10 rounded-xl"
              allowClear
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* SUMMARY CARDS */}
      {/* ----------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Average Rating */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Average Overall Rating
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <h3 className="font-spaceGrotesk text-3xl font-black text-[#092968]">
                  {summaryMetrics.averageRating}
                </h3>
                <span className="text-sm font-bold text-slate-400">/ 5.0</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
              <Star size={24} className="fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Rate
              disabled
              allowHalf
              value={summaryMetrics.averageRating}
              className="text-xs text-amber-400"
            />
            <span className="text-[11px] font-bold text-emerald-600">
              ({summaryMetrics.totalReviews} Total Verified Reviews)
            </span>
          </div>
        </Card>

        {/* Card 2: AI Sentiment Overview */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AI Positive Sentiment
              </p>
              <h3 className="font-spaceGrotesk text-3xl font-black text-emerald-600">
                {summaryMetrics.positivePct}%
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Smile size={24} />
            </div>
          </div>
          <div className="mt-3">
            <Progress
              percent={summaryMetrics.positivePct}
              strokeColor="#10b981"
              showInfo={false}
              size="small"
            />
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {summaryMetrics.positiveCount} of {summaryMetrics.totalReviews} reviews marked positive by AI
            </p>
          </div>
        </Card>

        {/* Card 3: Negative Review Attention */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Action Required (Negative)
              </p>
              <h3 className="font-spaceGrotesk text-3xl font-black text-rose-600">
                {summaryMetrics.negativeCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Frown size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-rose-600">
            <AlertTriangle size={14} />
            <span>{summaryMetrics.negativePct}% of recent guests require follow-up</span>
          </div>
        </Card>

        {/* Card 4: Service & Staff Score */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hospitality Health Score
              </p>
              <h3 className="font-spaceGrotesk text-3xl font-black text-[#F26E22]">
                94 / 100
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F26E22]">
              <HeartHandshake size={24} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <TrendingUp size={14} />
            <span>+4.2% higher satisfaction this month</span>
          </div>
        </Card>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* REVIEWS TABLE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredReviews}
            loading={isLoading || isRefetching}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reviews`,
              className: 'pt-3',
            }}
            className="custom-feedback-table"
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* SIDE DRAWER: FULL REVIEW DETAILS */}
      {/* ----------------------------------------------------------------------- */}
      <Drawer
        title={
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#092968]">
              <MessageSquareQuote size={20} />
            </div>
            <div>
              <h3 className="font-spaceGrotesk text-lg font-black text-[#092968]">
                Review Details • {selectedReview?.reviewId}
              </h3>
              <p className="text-xs text-slate-400">
                Order Ref: {selectedReview?.orderNumber || 'Dine-In Walk-In'}
              </p>
            </div>
          </div>
        }
        placement="right"
        width={540}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        footer={
          <div className="flex items-center justify-between py-2">
            <Button
              className="rounded-xl font-bold"
              onClick={() => setIsDrawerOpen(false)}
            >
              Close
            </Button>
            <Button
              type="primary"
              className="bg-[#092968] font-bold rounded-xl"
              onClick={() => setIsDrawerOpen(false)}
            >
              Mark as Followed Up ✓
            </Button>
          </div>
        }
      >
        {selectedReview && (
          <div className="space-y-6 py-2">
            {/* 1. Guest Information Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3.5">
                <Avatar
                  size={50}
                  style={{
                    backgroundColor:
                      selectedReview.aiSentiment === 'POSITIVE' ? '#10b981' : '#f43f5e',
                  }}
                  className="font-black text-white text-lg uppercase"
                >
                  {selectedReview.reviewerName.charAt(0)}
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-bold text-[#092968] text-base">
                    {selectedReview.reviewerName}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedReview.roomOrTable}</p>
                  <p className="text-[11px] text-slate-400">
                    {selectedReview.reviewerEmail} • {selectedReview.reviewerPhone}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Dining Timestamp:</span>
                <span className="font-bold text-slate-700">
                  {dayjs(selectedReview.date).format('DD MMMM YYYY')} at {selectedReview.time}
                </span>
              </div>
            </div>

            {/* 2. Rating & AI Sentiment Insight Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Overall Guest Rating
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Rate disabled defaultValue={selectedReview.rating} className="text-sm text-amber-400" />
                    <span className="font-mono text-sm font-black text-[#092968]">
                      {selectedReview.rating}.0 / 5.0
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-right">
                    AI Sentiment Classifier
                  </span>
                  {selectedReview.aiSentiment === 'POSITIVE' ? (
                    <Tag color="success" className="rounded-md font-bold text-xs mt-1">
                      😊 Positive ({selectedReview.aiConfidence}% AI Confidence)
                    </Tag>
                  ) : (
                    <Tag color="error" className="rounded-md font-bold text-xs mt-1">
                      ⚠️ Negative ({selectedReview.aiConfidence}% AI Confidence)
                    </Tag>
                  )}
                </div>
              </div>

              {/* AI Key Takeaway Banner */}
              <div className="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#092968]">
                  <Sparkles size={14} className="text-[#F26E22]" />
                  <span>AI Takeaway Summary</span>
                </div>
                <p className="text-slate-600 mt-1">{selectedReview.aiKeyTakeaway}</p>
              </div>
            </div>

            {/* 3. Review Comment & Text */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Guest Review Comment
              </h4>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed italic relative">
                <MessageSquareQuote
                  size={28}
                  className="absolute right-3 top-3 text-slate-200 pointer-events-none"
                />
                "{selectedReview.reviewText}"
              </div>
            </div>

            {/* 4. Guest Suggestions (If Any) */}
            {selectedReview.suggestions && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Guest Suggestions for Resort
                </h4>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 leading-relaxed">
                  💡 {selectedReview.suggestions}
                </div>
              </div>
            )}

            {/* 5. Food Items Ordered Breakdown */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Ordered Food Items ({selectedReview.foodItems.length})
              </h4>
              <div className="space-y-2">
                {selectedReview.foodItems.map((dish, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F26E22]">
                        <Utensils size={15} />
                      </div>
                      <div>
                        <p className="font-bold text-[#092968]">{dish.name}</p>
                        <p className="text-[10px] text-slate-400">{dish.category || 'Kitchen Meal'}</p>
                      </div>
                    </div>
                    {dish.itemRating && (
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-400" />
                        <span>{dish.itemRating}.0</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Served By Staff Details */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">Served By Staff Member</p>
                  <p className="font-bold text-[#092968] text-sm">{selectedReview.staffMember}</p>
                  <p className="text-[11px] text-slate-400">{selectedReview.staffRole || 'Restaurant Staff'}</p>
                </div>
              </div>
              <Tag color="blue" className="rounded-md font-bold text-[10px]">
                Assigned Server
              </Tag>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default GuestFeedback;
