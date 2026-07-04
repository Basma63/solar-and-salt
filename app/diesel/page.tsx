'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  ArrowRight,
  Fuel,
  Plus,
  Calendar,
  TrendingUp,
  TrendingDown,
  History,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { supabase, DailyDiesel, DieselTransaction } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RECIPIENT_OPTIONS = [
  'لودر',
  'حفار',
  'جرار',
  'مولد',
  'سيارة نقل',
  'أخرى',
];

export default function DieselPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Daily data
  const [dailyRecord, setDailyRecord] = useState<DailyDiesel | null>(null);
  const [transactions, setTransactions] = useState<DieselTransaction[]>([]);

  // Dialogs
  const [showOpeningBalanceDialog, setShowOpeningBalanceDialog] = useState(false);
  const [showReceivedDialog, setShowReceivedDialog] = useState(false);
  const [showDistributedDialog, setShowDistributedDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Forms
  const [openingBalance, setOpeningBalance] = useState('');
  const [receivedForm, setReceivedForm] = useState({
    date: today,
    quantity: '',
    supplier: '',
    notes: '',
  });
  const [distributedForm, setDistributedForm] = useState({
    date: today,
    quantity: '',
    recipient: '',
    notes: '',
  });
  const [editingTransaction, setEditingTransaction] = useState<DieselTransaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<DieselTransaction | null>(null);

  const checkAndCreateDailyRecord = useCallback(async () => {
    try {
      const { data: existingRecord, error: fetchError } = await supabase
        .from('daily_diesel')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingRecord) {
        setDailyRecord(existingRecord);
        const { data: txData, error: txError } = await supabase
          .from('diesel_transactions')
          .select('*')
          .eq('date', today)
          .order('created_at', { ascending: false });

        if (!txError && txData) {
          setTransactions(txData as DieselTransaction[]);
        }
      } else {
        const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
        const { data: yesterdayRecord } = await supabase
          .from('daily_diesel')
          .select('*')
          .eq('date', yesterday)
          .maybeSingle();

        if (yesterdayRecord && yesterdayRecord.remaining > 0) {
          setShowOpeningBalanceDialog(true);
        } else {
          const { data: newRecord, error: createError } = await supabase
            .from('daily_diesel')
            .insert({
              date: today,
              opening_balance: 0,
              received_today: 0,
              distributed_today: 0,
              remaining: 0,
            })
            .select()
            .single();

          if (!createError && newRecord) {
            setDailyRecord(newRecord as DailyDiesel);
          }
        }
      }
    } catch (error) {
      console.error('Error checking daily record:', error);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    checkAndCreateDailyRecord();
  }, [checkAndCreateDailyRecord]);

  const refreshData = async (date: string) => {
    const { data: recordData } = await supabase
      .from('daily_diesel')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (recordData) setDailyRecord(recordData as DailyDiesel);

    const { data: txData } = await supabase
      .from('diesel_transactions')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (txData) setTransactions(txData as DieselTransaction[]);
  };

  const handleOpeningBalanceSubmit = async () => {
    if (!openingBalance || isNaN(parseFloat(openingBalance))) return;
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('daily_diesel')
        .insert({
          date: today,
          opening_balance: parseFloat(openingBalance),
          received_today: 0,
          distributed_today: 0,
          remaining: parseFloat(openingBalance),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setDailyRecord(data as DailyDiesel);
        setShowOpeningBalanceDialog(false);
        setOpeningBalance('');
      }
    } catch (error) {
      console.error('Error creating daily record:', error);
      alert('حدث خطأ أثناء إنشاء السجل');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivedSubmit = async () => {
    if (!receivedForm.quantity || isNaN(parseFloat(receivedForm.quantity))) return;
    setSubmitting(true);

    try {
      const quantity = parseFloat(receivedForm.quantity);

      const { error: txError } = await supabase
        .from('diesel_transactions')
        .insert({
          type: 'received',
          date: receivedForm.date,
          quantity,
          supplier: receivedForm.supplier || null,
          notes: receivedForm.notes || null,
        });

      if (txError) throw txError;

      if (dailyRecord) {
        const newReceived = (dailyRecord.received_today || 0) + quantity;
        const newRemaining = (dailyRecord.opening_balance || 0) + newReceived - (dailyRecord.distributed_today || 0);

        const { error: updateError } = await supabase
          .from('daily_diesel')
          .update({
            received_today: newReceived,
            remaining: newRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dailyRecord.id);

        if (updateError) throw updateError;
      }

      await refreshData(receivedForm.date);
      setShowReceivedDialog(false);
      setReceivedForm({ date: today, quantity: '', supplier: '', notes: '' });
    } catch (error) {
      console.error('Error adding received:', error);
      alert('حدث خطأ أثناء إضافة الوارد');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDistributedSubmit = async () => {
    if (!distributedForm.quantity || isNaN(parseFloat(distributedForm.quantity))) return;
    setSubmitting(true);

    try {
      const quantity = parseFloat(distributedForm.quantity);

      const { error: txError } = await supabase
        .from('diesel_transactions')
        .insert({
          type: 'distributed',
          date: distributedForm.date,
          quantity,
          recipient: distributedForm.recipient || null,
          notes: distributedForm.notes || null,
        });

      if (txError) throw txError;

      if (dailyRecord) {
        const newDistributed = (dailyRecord.distributed_today || 0) + quantity;
        const newRemaining = (dailyRecord.opening_balance || 0) + (dailyRecord.received_today || 0) - newDistributed;

        const { error: updateError } = await supabase
          .from('daily_diesel')
          .update({
            distributed_today: newDistributed,
            remaining: newRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dailyRecord.id);

        if (updateError) throw updateError;
      }

      await refreshData(distributedForm.date);
      setShowDistributedDialog(false);
      setDistributedForm({ date: today, quantity: '', recipient: '', notes: '' });
    } catch (error) {
      console.error('Error adding distributed:', error);
      alert('حدث خطأ أثناء إضافة الصرف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingTransaction) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('diesel_transactions')
        .update({
          quantity: editingTransaction.quantity,
          supplier: editingTransaction.supplier,
          recipient: editingTransaction.recipient,
          notes: editingTransaction.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      // Recalculate daily totals
      await recalculateDailyTotals(editingTransaction.date);
      await refreshData(editingTransaction.date);
      setShowEditDialog(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error editing transaction:', error);
      alert('حدث خطأ أثناء التعديل');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) return;
    setSubmitting(true);

    try {
      const date = deletingTransaction.date;

      const { error } = await supabase
        .from('diesel_transactions')
        .delete()
        .eq('id', deletingTransaction.id);

      if (error) throw error;

      await recalculateDailyTotals(date);
      await refreshData(date);
      setShowDeleteDialog(false);
      setDeletingTransaction(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('حدث خطأ أثناء الحذف');
    } finally {
      setSubmitting(false);
    }
  };

  const recalculateDailyTotals = async (date: string) => {
    const { data: allTx } = await supabase
      .from('diesel_transactions')
      .select('*')
      .eq('date', date);

    if (!allTx) return;

    const receivedTotal = allTx
      .filter(tx => tx.type === 'received')
      .reduce((sum, tx) => sum + Number(tx.quantity), 0);

    const distributedTotal = allTx
      .filter(tx => tx.type === 'distributed')
      .reduce((sum, tx) => sum + Number(tx.quantity), 0);

    const { data: record } = await supabase
      .from('daily_diesel')
      .select('opening_balance')
      .eq('date', date)
      .maybeSingle();

    const openingBalance = record?.opening_balance || 0;
    const remaining = openingBalance + receivedTotal - distributedTotal;

    await supabase
      .from('daily_diesel')
      .update({
        received_today: receivedTotal,
        distributed_today: distributedTotal,
        remaining,
        updated_at: new Date().toISOString(),
      })
      .eq('date', date);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.supplier?.toLowerCase().includes(query) ||
      tx.recipient?.toLowerCase().includes(query) ||
      tx.notes?.toLowerCase().includes(query) ||
      tx.date.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white safe-top safe-bottom">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowRight className="w-6 h-6 text-slate-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Fuel className="w-6 h-6 text-blue-600" />
              إدارة السولار
            </h1>
          </div>
        </header>

        {/* Today Display */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">{todayDisplay}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            السجل
          </button>
        </div>

        {activeTab === 'today' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg shadow-blue-500/20">
                <p className="text-blue-100 text-sm mb-1">رصيد افتتاح اليوم</p>
                <p className="text-2xl font-bold text-white">
                  {dailyRecord?.opening_balance?.toLocaleString('ar-EG') || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">لتر</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg shadow-orange-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-orange-100" />
                  <p className="text-orange-100 text-sm">إجمالي الوارد اليوم</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {dailyRecord?.received_today?.toLocaleString('ar-EG') || 0}
                </p>
                <p className="text-orange-200 text-xs mt-1">لتر</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 shadow-lg shadow-red-500/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-100" />
                  <p className="text-red-100 text-sm">إجمالي المنصرف اليوم</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {dailyRecord?.distributed_today?.toLocaleString('ar-EG') || 0}
                </p>
                <p className="text-red-200 text-xs mt-1">لتر</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-lg shadow-green-500/20">
                <p className="text-green-100 text-sm mb-1">المتبقي</p>
                <p className="text-4xl font-bold text-white">
                  {dailyRecord?.remaining?.toLocaleString('ar-EG') || 0}
                </p>
                <p className="text-green-200 text-xs mt-1">لتر</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={() => setShowReceivedDialog(true)}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/25 text-lg font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة وارد سولار
              </Button>

              <Button
                onClick={() => setShowDistributedDialog(true)}
                className="w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl shadow-lg shadow-red-500/25 text-lg font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                إضافة صرف سولار
              </Button>
            </div>

            {/* Today's Transactions */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">حركات اليوم</h2>
                <span className="text-sm text-slate-500">{filteredTransactions.length} حركة</span>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                  <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد حركات اليوم</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tx.type === 'received'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.type === 'received' ? 'وارد' : 'صرف'}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setShowEditDialog(true);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTransaction(tx);
                              setShowDeleteDialog(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">
                            {format(new Date(tx.date), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">الكمية:</span>
                          <span className="text-xl font-bold text-slate-800">
                            {Number(tx.quantity).toLocaleString('ar-EG')} لتر
                          </span>
                        </div>

                        {tx.type === 'received' && tx.supplier && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">المورد:</span>
                            <span className="text-slate-800">{tx.supplier}</span>
                          </div>
                        )}

                        {tx.type === 'distributed' && tx.recipient && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">تم الصرف إلى:</span>
                            <span className="text-slate-800">{tx.recipient}</span>
                          </div>
                        )}

                        {tx.notes && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-sm text-slate-500">{tx.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* History Tab */}
            <div className="space-y-4 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <Label className="text-sm font-medium text-slate-600 mb-2 block">اختر التاريخ</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
              </div>

              <Button
                onClick={() => refreshData(selectedDate)}
                className="w-full"
                variant="outline"
              >
                عرض السجل
              </Button>
            </div>

            {/* Selected Date Display */}
            {dailyRecord && selectedDate !== today && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4">
                  <p className="text-blue-100 text-xs mb-1">رصيد الافتتاح</p>
                  <p className="text-xl font-bold text-white">
                    {dailyRecord.opening_balance?.toLocaleString('ar-EG') || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4">
                  <p className="text-orange-100 text-xs mb-1">الوارد</p>
                  <p className="text-xl font-bold text-white">
                    {dailyRecord.received_today?.toLocaleString('ar-EG') || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4">
                  <p className="text-red-100 text-xs mb-1">المنصرف</p>
                  <p className="text-xl font-bold text-white">
                    {dailyRecord.distributed_today?.toLocaleString('ar-EG') || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4">
                  <p className="text-green-100 text-xs mb-1">المتبقي</p>
                  <p className="text-xl font-bold text-white">
                    {dailyRecord.remaining?.toLocaleString('ar-EG') || 0}
                  </p>
                </div>
              </div>
            )}

            {/* History Transactions */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">الحركات</h2>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                  <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد حركات في هذا التاريخ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tx.type === 'received'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tx.type === 'received' ? 'وارد' : 'صرف'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm">
                            {format(new Date(tx.date), 'dd/MM/yyyy', { locale: ar })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">الكمية:</span>
                          <span className="text-xl font-bold text-slate-800">
                            {Number(tx.quantity).toLocaleString('ar-EG')} لتر
                          </span>
                        </div>

                        {tx.type === 'received' && tx.supplier && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">المورد:</span>
                            <span className="text-slate-800">{tx.supplier}</span>
                          </div>
                        )}

                        {tx.type === 'distributed' && tx.recipient && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">تم الصرف إلى:</span>
                            <span className="text-slate-800">{tx.recipient}</span>
                          </div>
                        )}

                        {tx.notes && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-sm text-slate-500">{tx.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Opening Balance Dialog */}
      <Dialog open={showOpeningBalanceDialog} onOpenChange={setShowOpeningBalanceDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">هل يوجد رصيد متبقي من أمس؟</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">رصيد افتتاح اليوم (لتر)</Label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="أدخل الكمية"
                className="text-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  const { data, error } = await supabase
                    .from('daily_diesel')
                    .insert({
                      date: today,
                      opening_balance: 0,
                      received_today: 0,
                      distributed_today: 0,
                      remaining: 0,
                    })
                    .select()
                    .single();
                  if (!error && data) {
                    setDailyRecord(data as DailyDiesel);
                    setShowOpeningBalanceDialog(false);
                  }
                }}
                className="h-12"
              >
                لا
              </Button>
              <Button
                onClick={handleOpeningBalanceSubmit}
                disabled={!openingBalance || submitting}
                className="h-12 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نعم'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Received Dialog */}
      <Dialog open={showReceivedDialog} onOpenChange={setShowReceivedDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              إضافة وارد سولار
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">التاريخ</Label>
              <Input
                type="date"
                value={receivedForm.date}
                onChange={(e) => setReceivedForm({ ...receivedForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">الكمية (لتر)</Label>
              <Input
                type="number"
                value={receivedForm.quantity}
                onChange={(e) => setReceivedForm({ ...receivedForm, quantity: e.target.value })}
                placeholder="أدخل الكمية"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">المورد</Label>
              <Input
                type="text"
                value={receivedForm.supplier}
                onChange={(e) => setReceivedForm({ ...receivedForm, supplier: e.target.value })}
                placeholder="اسم المورد"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">ملاحظات</Label>
              <Input
                type="text"
                value={receivedForm.notes}
                onChange={(e) => setReceivedForm({ ...receivedForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
              />
            </div>
            <Button
              onClick={handleReceivedSubmit}
              disabled={!receivedForm.quantity || submitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Distributed Dialog */}
      <Dialog open={showDistributedDialog} onOpenChange={setShowDistributedDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              إضافة صرف سولار
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">التاريخ</Label>
              <Input
                type="date"
                value={distributedForm.date}
                onChange={(e) => setDistributedForm({ ...distributedForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">الكمية (لتر)</Label>
              <Input
                type="number"
                value={distributedForm.quantity}
                onChange={(e) => setDistributedForm({ ...distributedForm, quantity: e.target.value })}
                placeholder="أدخل الكمية"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">تم الصرف إلى</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {RECIPIENT_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDistributedForm({ ...distributedForm, recipient: option })}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      distributedForm.recipient === option
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                value={distributedForm.recipient}
                onChange={(e) => setDistributedForm({ ...distributedForm, recipient: e.target.value })}
                placeholder="أو أدخل manually"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">ملاحظات</Label>
              <Input
                type="text"
                value={distributedForm.notes}
                onChange={(e) => setDistributedForm({ ...distributedForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
              />
            </div>
            <Button
              onClick={handleDistributedSubmit}
              disabled={!distributedForm.quantity || submitting}
              className="w-full h-12 bg-red-600 hover:bg-red-700"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">تعديل الحركة</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">الكمية (لتر)</Label>
                <Input
                  type="number"
                  value={editingTransaction.quantity}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      quantity: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              {editingTransaction.type === 'received' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">المورد</Label>
                  <Input
                    type="text"
                    value={editingTransaction.supplier || ''}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        supplier: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              {editingTransaction.type === 'distributed' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">تم الصرف إلى</Label>
                  <Input
                    type="text"
                    value={editingTransaction.recipient || ''}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        recipient: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div>
                <Label className="text-sm font-medium mb-2 block">ملاحظات</Label>
                <Input
                  type="text"
                  value={editingTransaction.notes || ''}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                onClick={handleEditSubmit}
                disabled={submitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ التعديل'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg text-red-600">تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-center text-slate-600">
              هل أنت متأكد من حذف هذه الحركة؟
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="h-12"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleDelete}
                disabled={submitting}
                className="h-12 bg-red-600 hover:bg-red-700"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حذف'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
