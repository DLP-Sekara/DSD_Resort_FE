import { Card, Skeleton } from "antd";

const GridSkeleton = () => {
  return (
    <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="overflow-hidden rounded-lg shadow-sm">
          <div className="h-52 w-full overflow-hidden rounded-t-lg bg-gray-200">
            <Skeleton.Image
              active
              className="h-full w-full object-cover"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
          <div className="p-3">
            <Skeleton.Input active size="small" className="mb-2 w-3/4" />
            <Skeleton.Input active size="small" className="mb-2 w-1/2" />
            <div className="flex gap-2">
              <Skeleton.Button active size="small" shape="round" />
              <Skeleton.Button active size="small" shape="round" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default GridSkeleton;
