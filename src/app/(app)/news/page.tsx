import { Topbar } from '@/components/layout/topbar';
import { NewsList } from '@/components/news/news-list';

export default function NewsPage() {
  return (
    <>
      <Topbar title="News" />
      <main className="flex-1 overflow-auto p-5">
        <NewsList />
      </main>
    </>
  );
}
