import { useState, useEffect } from 'react';
import { useFootballStore, ClubRule, ClubRank, ClubAchievement } from '@/store/footballStore';
import { Button, Input, Modal, DeleteConfirm, ImageUpload, Textarea } from '@/shared/components';
import { Search, Plus, Shield, Award, Trophy, Trash2, Edit } from 'lucide-react';
import { fuzzyFilter } from '@/shared/lib/utils';

type ActiveTab = 'rules' | 'ranks' | 'achievements';

type ModalState = 
  | { type: 'add_rule' }
  | { type: 'edit_rule', data: ClubRule }
  | { type: 'delete_rule', data: ClubRule }
  | { type: 'add_rank' }
  | { type: 'edit_rank', data: ClubRank }
  | { type: 'delete_rank', data: ClubRank }
  | { type: 'add_achievement' }
  | { type: 'edit_achievement', data: ClubAchievement }
  | { type: 'delete_achievement', data: ClubAchievement }
  | null;

export function ClubInfo() {
  const {
    clubRules,
    clubRanks,
    clubAchievements,
    fetchClubRules,
    addClubRule,
    updateClubRule,
    removeClubRule,
    fetchClubRanks,
    addClubRank,
    updateClubRank,
    removeClubRank,
    fetchClubAchievements,
    addClubAchievement,
    updateClubAchievement,
    removeClubAchievement
  } = useFootballStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('rules');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);

  // Form states
  const [ruleForm, setRuleForm] = useState({ title: '', subtitle: '', description: '' });
  const [rankForm, setRankForm] = useState({ imageUrl: '', title: '', subtitle: '', description: '' });
  const [achievementForm, setAchievementForm] = useState({ imageUrl: '', title: '', subtitle: '', description: '' });

  useEffect(() => {
    fetchClubRules();
    fetchClubRanks();
    fetchClubAchievements();
  }, [fetchClubRules, fetchClubRanks, fetchClubAchievements]);

  // Open modals with pre-filled forms if editing
  const openAddRule = () => {
    setRuleForm({ title: '', subtitle: '', description: '' });
    setModal({ type: 'add_rule' });
  };
  const openEditRule = (rule: ClubRule) => {
    setRuleForm({ title: rule.title, subtitle: rule.subtitle, description: rule.description });
    setModal({ type: 'edit_rule', data: rule });
  };

  const openAddRank = () => {
    setRankForm({ imageUrl: '', title: '', subtitle: '', description: '' });
    setModal({ type: 'add_rank' });
  };
  const openEditRank = (rank: ClubRank) => {
    setRankForm({ imageUrl: rank.imageUrl, title: rank.title, subtitle: rank.subtitle, description: rank.description });
    setModal({ type: 'edit_rank', data: rank });
  };

  const openAddAchievement = () => {
    setAchievementForm({ imageUrl: '', title: '', subtitle: '', description: '' });
    setModal({ type: 'add_achievement' });
  };
  const openEditAchievement = (ach: ClubAchievement) => {
    setAchievementForm({ imageUrl: ach.imageUrl, title: ach.title, subtitle: ach.subtitle, description: ach.description });
    setModal({ type: 'edit_achievement', data: ach });
  };

  // Submit handlers
  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.title.trim()) return;

    if (modal?.type === 'add_rule') {
      addClubRule(ruleForm);
    } else if (modal?.type === 'edit_rule' && modal.data) {
      updateClubRule({ ...modal.data, ...ruleForm });
    }
    setModal(null);
  };

  const handleRankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankForm.title.trim()) return;

    if (modal?.type === 'add_rank') {
      addClubRank(rankForm);
    } else if (modal?.type === 'edit_rank' && modal.data) {
      updateClubRank({ ...modal.data, ...rankForm });
    }
    setModal(null);
  };

  const handleAchievementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.title.trim()) return;

    if (modal?.type === 'add_achievement') {
      addClubAchievement(achievementForm);
    } else if (modal?.type === 'edit_achievement' && modal.data) {
      updateClubAchievement({ ...modal.data, ...achievementForm });
    }
    setModal(null);
  };

  // Filtering based on active tab and search query
  const filteredRules = fuzzyFilter(clubRules, search, ['title', 'subtitle', 'description']);
  const filteredRanks = fuzzyFilter(clubRanks, search, ['title', 'subtitle', 'description']);
  const filteredAchievements = fuzzyFilter(clubAchievements, search, ['title', 'subtitle', 'description']);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-bold text-[24px] tracking-tight mb-1 text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Club Info Management
          </h2>
          <p className="text-muted-foreground text-[13px]">
            Manage club rules, ranks, and tournament achievements
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search..." 
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>
          {activeTab === 'rules' && (
            <Button onClick={openAddRule}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Rule
            </Button>
          )}
          {activeTab === 'ranks' && (
            <Button onClick={openAddRank}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Rank
            </Button>
          )}
          {activeTab === 'achievements' && (
            <Button onClick={openAddAchievement}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Achievement
            </Button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('rules'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'rules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" /> Club Rules
        </button>
        <button
          onClick={() => { setActiveTab('ranks'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'ranks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Trophy className="w-4 h-4" /> Club Ranks
        </button>
        <button
          onClick={() => { setActiveTab('achievements'); setSearch(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition-all -mb-px ${
            activeTab === 'achievements'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award className="w-4 h-4" /> Achievements
        </button>
      </div>

      {/* Dynamic Content view */}
      {activeTab === 'rules' && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRules.map(rule => (
            <div key={rule.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between group">
              <div>
                <h3 className="font-bold text-[16px] mb-1 text-foreground leading-snug">{rule.title}</h3>
                {rule.subtitle && <p className="text-[12px] font-medium text-primary mb-3">{rule.subtitle}</p>}
                <p className="text-[13px] text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{rule.description || 'No description provided.'}</p>
              </div>
              <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-border/40 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" onClick={() => openEditRule(rule)}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete_rule', data: rule })}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
          {filteredRules.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
              <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-[14px]">No rules found. Add one to get started!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ranks' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRanks.map(rank => (
            <div key={rank.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm hover:border-primary/40 transition-all group">
              {rank.imageUrl && (
                <div className="h-44 w-full bg-muted/20 border-b border-border p-4 flex items-center justify-center">
                  <img src={rank.imageUrl} alt={rank.title} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[16px] mb-1 text-foreground leading-snug">{rank.title}</h3>
                  {rank.subtitle && <p className="text-[12px] font-medium text-primary mb-3">{rank.subtitle}</p>}
                  <p className="text-[13px] text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{rank.description || 'No description.'}</p>
                </div>
                <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-border/40 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => openEditRank(rank)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete_rank', data: rank })}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredRanks.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
              <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-[14px]">No club ranks found. Add one to get started!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map(ach => (
            <div key={ach.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm hover:border-primary/40 transition-all group">
              {ach.imageUrl && (
                <div className="h-44 w-full bg-muted/20 border-b border-border p-4 flex items-center justify-center">
                  <img src={ach.imageUrl} alt={ach.title} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[16px] mb-1 text-foreground leading-snug">{ach.title}</h3>
                  {ach.subtitle && <p className="text-[12px] font-medium text-primary mb-3">{ach.subtitle}</p>}
                  <p className="text-[13px] text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{ach.description || 'No description.'}</p>
                </div>
                <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-border/40 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => openEditAchievement(ach)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete_achievement', data: ach })}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredAchievements.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-xl">
              <Award className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-[14px]">No achievements found. Add one to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Rules Add/Edit Modals */}
      {(modal?.type === 'add_rule' || modal?.type === 'edit_rule') && (
        <Modal 
          title={modal.type === 'add_rule' ? 'Add Club Rule' : 'Edit Club Rule'} 
          onClose={() => setModal(null)} 
          isOpen
        >
          <form onSubmit={handleRuleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Rule Title *</label>
              <Input 
                value={ruleForm.title} 
                onChange={e => setRuleForm({ ...ruleForm, title: e.target.value })} 
                placeholder="e.g. Attendance Policy"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Subtitle</label>
              <Input 
                value={ruleForm.subtitle} 
                onChange={e => setRuleForm({ ...ruleForm, subtitle: e.target.value })} 
                placeholder="e.g. Section 2.1"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Rule Description</label>
              <Textarea 
                value={ruleForm.description} 
                onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} 
                placeholder="Enter detail content for the club rule..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ranks Add/Edit Modals */}
      {(modal?.type === 'add_rank' || modal?.type === 'edit_rank') && (
        <Modal 
          title={modal.type === 'add_rank' ? 'Add Club Rank' : 'Edit Club Rank'} 
          onClose={() => setModal(null)} 
          isOpen
        >
          <form onSubmit={handleRankSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[12px] font-medium mb-1.5 text-foreground">Rank Badge / Tournament Image</label>
              <ImageUpload
                value={rankForm.imageUrl}
                onChange={b64 => setRankForm({ ...rankForm, imageUrl: b64 })}
                onRemove={() => setRankForm({ ...rankForm, imageUrl: '' })}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Tournament Title *</label>
              <Input 
                value={rankForm.title} 
                onChange={e => setRankForm({ ...rankForm, title: e.target.value })} 
                placeholder="e.g. Gold Rank / Champions Trophy"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Subtitle</label>
              <Input 
                value={rankForm.subtitle} 
                onChange={e => setRankForm({ ...rankForm, subtitle: e.target.value })} 
                placeholder="e.g. Division A"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Description</label>
              <Textarea 
                value={rankForm.description} 
                onChange={e => setRankForm({ ...rankForm, description: e.target.value })} 
                placeholder="Enter tournament details or criteria..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Achievements Add/Edit Modals */}
      {(modal?.type === 'add_achievement' || modal?.type === 'edit_achievement') && (
        <Modal 
          title={modal.type === 'add_achievement' ? 'Add Achievement' : 'Edit Achievement'} 
          onClose={() => setModal(null)} 
          isOpen
        >
          <form onSubmit={handleAchievementSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-[12px] font-medium mb-1.5 text-foreground">Achievement Image</label>
              <ImageUpload
                value={achievementForm.imageUrl}
                onChange={b64 => setAchievementForm({ ...achievementForm, imageUrl: b64 })}
                onRemove={() => setAchievementForm({ ...achievementForm, imageUrl: '' })}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Title *</label>
              <Input 
                value={achievementForm.title} 
                onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })} 
                placeholder="e.g. League Champions 2026"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Subtitle</label>
              <Input 
                value={achievementForm.subtitle} 
                onChange={e => setAchievementForm({ ...achievementForm, subtitle: e.target.value })} 
                placeholder="e.g. First place finish"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1 text-foreground">Description</label>
              <Textarea 
                value={achievementForm.description} 
                onChange={e => setAchievementForm({ ...achievementForm, description: e.target.value })} 
                placeholder="Enter achievement details..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modals */}
      <DeleteConfirm 
        isOpen={modal?.type === 'delete_rule'}
        label={modal?.type === 'delete_rule' ? modal.data.title : ''}
        onConfirm={() => {
          if (modal?.type === 'delete_rule' && modal.data) removeClubRule(modal.data.id);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />

      <DeleteConfirm 
        isOpen={modal?.type === 'delete_rank'}
        label={modal?.type === 'delete_rank' ? modal.data.title : ''}
        onConfirm={() => {
          if (modal?.type === 'delete_rank' && modal.data) removeClubRank(modal.data.id);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />

      <DeleteConfirm 
        isOpen={modal?.type === 'delete_achievement'}
        label={modal?.type === 'delete_achievement' ? modal.data.title : ''}
        onConfirm={() => {
          if (modal?.type === 'delete_achievement' && modal.data) removeClubAchievement(modal.data.id);
          setModal(null);
        }}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
