import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Sidebar />

      <div className="flex flex-1 flex-col lg:pl-[260px]">
        <TopNav />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
