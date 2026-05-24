import { Wheat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 text-white lg:flex relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <Wheat className="size-5" />
          </div>
          <span className="text-xl font-bold">Grainix ERP</span>
        </div>
        <div className="relative">
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed">
              &ldquo;Grainix has transformed how we manage our entire rice
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
