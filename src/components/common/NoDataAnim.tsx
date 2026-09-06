import NoData from "../../assets/images/svg/NoData";

const NoDataAnim = ({ message }: { message?: string }) => {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-1">
      <NoData />
      <p className="text-xs font-semibold text-gray-500">
        {message || "No data to display."}
      </p>
    </div>
  );
};

export default NoDataAnim;
