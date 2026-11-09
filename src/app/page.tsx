const Box = ({ w }: { w: string }) => (
  <div className={`@container ${w} border p-4`}>
    <div className="bg-red-200 p-4 @tablet:bg-yellow-200 @desktop:bg-green-200">
      أحمر = موبايل · أصفر = تابلت · أخضر = مكتب
    </div>
  </div>
);

export default function Page() {
  return (
    <main className="space-y-6 p-6">
      <Box w="w-[390px]" />
      <Box w="w-[800px]" />
      <Box w="w-[1300px]" />
    </main>
  );
}