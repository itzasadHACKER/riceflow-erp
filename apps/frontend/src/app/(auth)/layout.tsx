import { Wheat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Wheat className="size-5" />
          </div>
          <span className="text-xl font-bold">RiceFlow ERP</span>
        </div>
        <div>
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;RiceFlow has transformed how we manage our entire rice
              milling operation. From paddy procurement to export-quality
              grading, everything is in one place.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              — Rice Mill Owner, Punjab
            </footer>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
