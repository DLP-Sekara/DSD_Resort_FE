import Footer from '../components/onBoarding/Footer';
type props = {
  children: React.ReactNode;
  footer?: boolean;
};
const AdminOnBoardingLayout = ({ children, footer = true }: props) => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden bg-blue-50">
      <div className="flex h-full w-full flex-col items-center justify-between gap-5 overflow-y-auto px-5 pb-5 pt-20">
        <div className="flex w-full flex-col items-center lg:w-[40%] 2xl:w-[80%]">
          {children}
        </div>

        {footer && <Footer />}
      </div>
    </div>
  );
};

export default AdminOnBoardingLayout;
