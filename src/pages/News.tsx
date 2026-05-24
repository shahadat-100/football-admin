import { useState } from 'react';
import { useFootballStore } from '@/store/footballStore';
import { NewsArticle } from '@/features/news/types';
import { NewsForm } from '@/features/news';
import { Button, Input, Modal, DeleteConfirm, Badge } from '@/shared/components';
import { fuzzyFilter } from '@/shared/lib/utils';
import { Search, Plus } from 'lucide-react';

export function News() {
  const { news, addNews, updateNews, removeNews } = useFootballStore();
  const [modal, setModal] = useState<{ type: 'add' | 'edit' | 'delete', data?: NewsArticle } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const filtered = fuzzyFilter(news, search, ['title', 'author', 'category']);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {modal?.type === 'add' && (
        <Modal title="Publish news" onClose={() => setModal(null)} isOpen wide>
          <NewsForm 
            onSave={(d) => { addNews({ ...d, id: Math.random().toString(36).slice(2,9) } as NewsArticle); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && modal.data && (
        <Modal title="Edit article" onClose={() => setModal(null)} isOpen wide>
          <NewsForm 
            initial={modal.data}
            onSave={(d) => { updateNews({ ...d, id: modal.data!.id } as NewsArticle); setModal(null); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      <DeleteConfirm 
        isOpen={modal?.type === 'delete'}
        label={modal?.data?.title ?? ''}
        onConfirm={() => { if (modal?.data) removeNews(modal.data.id); setModal(null); }}
        onClose={() => setModal(null)}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-bold text-[22px] mb-1">News</h2>
          <p className="text-muted-foreground text-[13px]">{news.length} articles</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search articles..." 
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          <Button onClick={() => setModal({ type: 'add' })}>
            <Plus className="w-4 h-4 mr-1.5" /> Publish News
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paginated.map(n => (
          <div key={n.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm hover:border-primary/50 transition-colors">
            {n.image && (
              <div className="h-48 w-full overflow-hidden flex-shrink-0">
                <img src={n.image} alt={n.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {n.hot && <Badge bg="#7f1d1d" c="#fca5a5">Hot</Badge>}
                <Badge bg="#111111" c="#e5e5e5">{n.category}</Badge>
                <span className="text-muted-foreground text-[11px] ml-auto">{n.date}</span>
              </div>
              <h3 className="font-bold text-[15px] mb-2 leading-tight">{n.title}</h3>
              <p className="text-muted-foreground text-[12px] leading-relaxed mb-4 flex-1 break-words line-clamp-3">
                {n.content || 'No content provided.'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                <p className="text-muted-foreground text-[11px]">By <span className="font-medium text-foreground">{n.author}</span></p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'edit', data: n })}>✎</Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', data: n })}>✕</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-[14px]">No articles found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 bg-card border border-border p-3 rounded-xl shadow-sm">
          <p className="text-[12px] text-muted-foreground">
            Showing {(page-1)*PAGE_SIZE + 1} to {Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} articles
          </p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center px-3 text-[12px] font-medium border border-border rounded-md bg-muted/30">
              Page {page} of {totalPages}
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
