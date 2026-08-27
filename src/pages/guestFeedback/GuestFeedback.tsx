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
} from 'lucide-react';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

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

// ---------------------------------------------------------------------------
// DUMMY GUEST FEEDBACK & REVIEWS DATA
// ---------------------------------------------------------------------------
const DUMMY_REVIEWS: GuestReviewItem[] = [
  {
    id: '1',
    reviewId: 'REV-9021',
    orderNumber: 'ORD-9E4832',
    reviewerName: 'Michael Anderson',
    reviewerEmail: 'm.anderson@example.com',
    reviewerPhone: '+1 (555) 349-2810',
    roomOrTable: 'Table #4 (Pool Terrace)',
    date: '2026-08-27',
    time: '01:30 PM',
    timestamp: '2026-08-27T13:30:00',
    rating: 5,
    aiSentiment: 'POSITIVE',
    aiConfidence: 97,
    aiKeyTakeaway: 'Exceptional seafood freshness and prompt attentive service.',
    reviewText:
      'The Seafood Fried Rice and Devilled Lagoon Prawns were out of this world! Incredible burst of authentic spices, served steaming hot within 15 minutes. Server Samantha made our lunch unforgettable with her wine recommendation.',
    suggestions: 'Please keep the spicy lagoon prawns permanently on the lunch special menu!',
    staffMember: 'Samantha Wickramasinghe',
    staffRole: 'Senior Waitress',
    foodItems: [
      { name: 'Sea Food Rice large', category: 'Main Dish', itemRating: 5 },
      { name: 'Devilled Lagoon Prawns with Fried Rice', category: 'Seafood Special', itemRating: 5 },
    ],
    status: 'REVIEWED',
  },
  {
    id: '2',
    reviewId: 'REV-9022',
    orderNumber: 'ORD-8B3109',
    reviewerName: 'Dr. Elena Rostova',
    reviewerEmail: 'elena.rostova@resortvip.org',
    reviewerPhone: '+44 7911 123456',
    roomOrTable: 'Villa Suite #204',
    date: '2026-08-27',
    time: '12:15 PM',
    timestamp: '2026-08-27T12:15:00',
    rating: 2,
    aiSentiment: 'NEGATIVE',
    aiConfidence: 92,
    aiKeyTakeaway: 'Steak temperature inaccuracy and slow food delivery time.',
    reviewText:
      'The Grilled Herb Butter Reef Fish arrived lukewarm and we waited nearly 40 minutes after ordering appetizers. The server apologized politely, but the kitchen pacing was noticeably slow during lunch rush.',
    suggestions: 'Improve kitchen-to-table coordination for hot entrees during peak rush hours.',
    staffMember: 'Kasun Bandara',
    staffRole: 'Food Server',
    foodItems: [
      { name: 'Grilled Herb Butter Reef Fish', category: 'Grill & Seafood', itemRating: 2 },
      { name: 'Spaghetti Carbonara (Regular)', category: 'Pasta', itemRating: 3 },
    ],
    status: 'NEEDS_ACTION',
  },
  {
    id: '3',
    reviewId: 'REV-9023',
    orderNumber: 'ORD-7A1194',
    reviewerName: 'Rajesh & Priya Sharma',
    reviewerEmail: 'rajesh.sharma@traveldiaries.in',
    reviewerPhone: '+91 98200 12345',
    roomOrTable: 'Table #12 (Garden Pavilion)',
    date: '2026-08-26',
    time: '08:45 PM',
    timestamp: '2026-08-26T20:45:00',
    rating: 5,
    aiSentiment: 'POSITIVE',
    aiConfidence: 99,
    aiKeyTakeaway: 'Memorable anniversary dining experience with impeccable hospitality.',
    reviewText:
      'Celebrated our 10th anniversary tonight. Chef Kumara personally came out to explain the secret curry spices and Basmati preparation. Nimal provided five-star table care throughout our 3-course dinner. Outstanding luxury resort hospitality!',
    suggestions: 'Offer a dessert sampler pairing with local Ceylon tea.',
    staffMember: 'Nimal Jayasuriya',
    staffRole: 'Head Waiter',
    foodItems: [
      { name: 'Spicy Chicken Curry with Basmati', category: 'Authentic Sri Lankan', itemRating: 5 },
      { name: 'Sri Lankan String Hoppers with Kiri Hodi', category: 'Traditional', itemRating: 5 },
    ],
    status: 'REVIEWED',
  },
  {
    id: '4',
    reviewId: 'REV-9024',
    orderNumber: 'ORD-6F9820',
    reviewerName: 'Sarah Jenkins',
    reviewerEmail: 's.jenkins@australiatravel.au',
    reviewerPhone: '+61 412 345 678',
    roomOrTable: 'Cabana #2 (Beachfront)',
    date: '2026-08-26',
    time: '02:00 PM',
    timestamp: '2026-08-26T14:00:00',
    rating: 4,
    aiSentiment: 'POSITIVE',
    aiConfidence: 89,
    aiKeyTakeaway: 'Delicious flavors, slightly mild spice level than requested.',
    reviewText:
      'Very appetizing lunch by the beach. The Carbonara was creamy and rich. However, I asked for extra spicy sambol on the side which was forgotten on the first pass, but Kasun quickly brought it over with a smile.',
    suggestions: 'Include gluten-free pasta options on the main menu.',
    staffMember: 'Kasun Bandara',
    staffRole: 'Food Server',
    foodItems: [
      { name: 'Spaghetti Carbonara (Regular)', category: 'Pasta', itemRating: 4 },
      { name: 'Sea Food Rice large', category: 'Main Dish', itemRating: 4 },
    ],
    status: 'REVIEWED',
  },
  {
    id: '5',
    reviewId: 'REV-9025',
    orderNumber: 'ORD-5C4391',
    reviewerName: 'Hans & Greta Weber',
    reviewerEmail: 'hans.weber@munich.de',
    reviewerPhone: '+49 89 1234567',
    roomOrTable: 'Table #9 (Main Dining Hall)',
    date: '2026-08-25',
    time: '09:15 AM',
    timestamp: '2026-08-25T09:15:00',
    rating: 5,
    aiSentiment: 'POSITIVE',
    aiConfidence: 96,
    aiKeyTakeaway: 'Flawless breakfast buffet and warm Sri Lankan string hopper breakfast.',
    reviewText:
      'The morning string hoppers and coconut sambol breakfast was the highlight of our stay. Everything tasted fresh and authentic. Service by Dilshan was swift and very welcoming.',
    suggestions: 'Extend morning breakfast hours on weekends until 11:00 AM.',
    staffMember: 'Dilshan Perera',
    staffRole: 'Breakfast Steward',
    foodItems: [
      { name: 'Sri Lankan String Hoppers with Kiri Hodi', category: 'Traditional', itemRating: 5 },
    ],
    status: 'REVIEWED',
  },
  {
    id: '6',
    reviewId: 'REV-9026',
    orderNumber: 'ORD-4E7210',
    reviewerName: 'Marcus Aurelius Vance',
    reviewerEmail: 'marcus.vance@techcorp.io',
    reviewerPhone: '+1 (415) 890-4321',
    roomOrTable: 'Executive Villa #101',
    date: '2026-08-24',
    time: '07:30 PM',
    timestamp: '2026-08-24T19:30:00',
    rating: 1,
    aiSentiment: 'NEGATIVE',
    aiConfidence: 95,
    aiKeyTakeaway: 'Allergy warning oversight and undercooked seafood.',
    reviewText:
      'We specifically noted a dairy restriction upon ordering, yet butter was added on top of the grilled fish. We had to send the plate back. Extremely disappointing for a resort of this standard.',
    suggestions: 'Enforce strict digital tagging between server order tablets and kitchen prep monitors for allergen alerts.',
    staffMember: 'Dinesh Fernando',
    staffRole: 'Junior Server',
    foodItems: [
      { name: 'Grilled Herb Butter Reef Fish', category: 'Grill & Seafood', itemRating: 1 },
    ],
    status: 'NEEDS_ACTION',
  },
];

// Distinct Staff Members & Food Items list for filters
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

const GuestFeedback: React.FC = () => {
  // ---------------------------------------------------------------------------
  // FILTER STATES
  // ---------------------------------------------------------------------------
  const [selectedStaff, setSelectedStaff] = useState<string>('ALL');
  const [selectedFoodItem, setSelectedFoodItem] = useState<string>('ALL');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(
    null,
  );
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
    return DUMMY_REVIEWS.filter((item) => {
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

      // 4. Date Range Filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const itemDate = dayjs(item.timestamp);
        const start = dateRange[0].startOf('day');
        const end = dateRange[1].endOf('day');
        if (itemDate.isBefore(start) || itemDate.isAfter(end)) {
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
  }, [selectedStaff, selectedFoodItem, selectedSentiment, dateRange, searchText]);

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
    setDateRange(null);
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
      width: 120,
      render: (_, record) => (
        <Button
          onClick={() => handleOpenReviewDetails(record)}
          className="h-8 rounded-xl px-3 font-bold text-xs text-[#092968] border-slate-200 hover:border-[#092968] hover:text-[#092968] flex items-center gap-1.5 ml-auto"
        >
          <MessageCircle size={14} />
          <span>View Details</span>
        </Button>
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
        </div>
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* ABOVE TABLE: FINAL RESTAURANT REVIEW SUMMARY CARDS */}
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
          {/* 1. Date Range Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-400">
              Filter by Date Range
            </label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
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
      {/* REVIEWS TABLE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredReviews}
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
