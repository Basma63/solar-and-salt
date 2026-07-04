'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Loader2,
  Fuel,
  Droplets,
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase, DailyDiesel, DailySalt } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DateFilter = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';

interface DieselReport {
  openingBalance: number;
  received: number;
  distributed: number;
  remaining: number;
}

interface SaltReport {
  openingBalance: number;
  production: number;
  distributed: number;
  remaining: number;
}

export default function ReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [dieselReport, setDieselReport] = useState<DieselReport | null>(null);
  const [saltReport, setSaltReport] = useState<SaltReport | null>(null);

  const getDateRange = () => {
    switch (dateFilter) {
      case 'today':
        return { start: today, end: today };
      case 'yesterday':
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
        return { start: yesterday, end: yesterday };
      case 'this_week':
        return {
          start: format(startOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(new Date(), { weekStartsOn: 6 }), 'yyyy-MM-dd'),
        };
      case 'this_month':
        return {
          start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: today, end: today };
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // Fetch diesel data
      const { data: dieselData } = await supabase
        .from('daily_diesel')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (dieselData && dieselData.length > 0) {
        const firstRecord = dieselData[0];
        const lastRecord = dieselData[dieselData.length - 1];
        const totalReceived = dieselData.reduce((sum, d) => sum + Number(d.received_today || 0), 0);
        const totalDistributed = dieselData.reduce((sum, d) => sum + Number(d.distributed_today || 0), 0);
        const totalRemaining = Number(lastRecord.remaining || 0);

        setDieselReport({
          openingBalance: Number(firstRecord.opening_balance || 0),
          received: totalReceived,
          distributed: totalDistributed,
          remaining: totalRemaining,
        });
      } else {
        setDieselReport(null);
      }

      // Fetch salt data
      const { data: saltData } = await supabase
        .from('daily_salt')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      if (saltData && saltData.length > 0) {
        const firstRecord = saltData[0];
        const lastRecord = saltData[saltData.length - 1];
        const totalProduction = saltData.reduce((sum, d) => sum + Number(d.production_today || 0), 0);
        const totalDistributed = saltData.reduce((sum, d) => sum + Number(d.distributed_today || 0), 0);
        const totalRemaining = Number(lastRecord.remaining || 0);

        setSaltReport({
          openingBalance: Number(firstRecord.opening_balance || 0),
          production: totalProduction,
          distributed: totalDistributed,
          remaining: totalRemaining,
        });
      } else {
        setSaltReport(null);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFilter]);

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const { start, end } = getDateRange();

      // Fetch full data for export
      const { data: dieselData } = await supabase
        .from('daily_diesel')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      const { data: saltData } = await supabase
        .from('daily_salt')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      const workbook = XLSX.utils.book_new();

      // Diesel sheet
      if (dieselData && dieselData.length > 0) {
        const dieselSheetData = dieselData.map((d: DailyDiesel) => ({
          التاريخ: d.date,
          'رصيد الافتتاح': d.opening_balance,
          'الوارد اليوم': d.received_today,
          'المنصرف اليوم': d.distributed_today,
          'المتبقي': d.remaining,
        }));
        const dieselSheet = XLSX.utils.json_to_sheet(dieselSheetData);
        XLSX.utils.book_append_sheet(workbook, dieselSheet, 'تقرير السولار');
      }

      // Salt sheet
      if (saltData && saltData.length > 0) {
        const saltSheetData = saltData.map((s: DailySalt) => ({
          التاريخ: s.date,
          'رصيد الافتتاح': s.opening_balance,
          'إنتاج اليوم': s.production_today,
          'المنصرف اليوم': s.distributed_today,
          'المتبقي': s.remaining,
        }));
        const saltSheet = XLSX.utils.json_to_sheet(saltSheetData);
        XLSX.utils.book_append_sheet(workbook, saltSheet, 'تقرير الملح');
      }

      const fileName = `تقرير_${start}_${end}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const { start, end } = getDateRange();

      // Add Arabic font support note
      doc.setFont('helvetica', 'normal');
      doc.setR2L(true);

      let yPosition = 20;

      // Title
      doc.setFontSize(18);
      doc.text('Fuel & Salt Report', 105, yPosition, { align: 'center' });
      doc.setFontSize(12);
      yPosition += 10;
      doc.text(`Period: ${start} to ${end}`, 105, yPosition, { align: 'center' });

      yPosition += 20;

      // Diesel Report
      doc.setFontSize(16);
      doc.text('Diesel Report', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      if (dieselReport) {
        doc.text(`Opening Balance: ${dieselReport.openingBalance.toLocaleString('ar-EG')} Liters`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Received: ${dieselReport.received.toLocaleString('ar-EG')} Liters`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Distributed: ${dieselReport.distributed.toLocaleString('ar-EG')} Liters`, 20, yPosition);
        yPosition += 7;
        doc.text(`Remaining: ${dieselReport.remaining.toLocaleString('ar-EG')} Liters`, 20, yPosition);
      } else {
        doc.text('No data available', 20, yPosition);
      }

      yPosition += 20;

      // Salt Report
      doc.setFontSize(16);
      doc.text('Salt Report', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      if (saltReport) {
        doc.text(`Opening Balance: ${saltReport.openingBalance.toLocaleString('ar-EG')} Kg`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Production: ${saltReport.production.toLocaleString('ar-EG')} Kg`, 20, yPosition);
        yPosition += 7;
        doc.text(`Total Distributed: ${saltReport.distributed.toLocaleString('ar-EG')} Kg`, 20, yPosition);
        yPosition += 7;
        doc.text(`Remaining: ${saltReport.remaining.toLocaleString('ar-EG')} Kg`, 20, yPosition);
      } else {
        doc.text('No data available', 20, yPosition);
      }

      doc.save(`Report_${start}_${end}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء التصدير');
    } finally {
      setExporting(false);
    }
  };

  const filterOptions = [
    { value: 'today', label: 'اليوم' },
    { value: 'yesterday', label: 'أمس' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'this_month', label: 'هذا الشهر' },
    { value: 'custom', label: 'مخصص' },
  ] as const;

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
              <BarChart3 className="w-6 h-6 text-slate-700" />
              التقارير
            </h1>
          </div>
        </header>

        {/* Date Filter */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateFilter(option.value)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  dateFilter === option.value
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3 bg-white rounded-2xl p-4 border border-slate-200">
              <div>
                <Label className="text-sm font-medium mb-2 block">من</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">إلى</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Diesel Report */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Fuel className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">تقرير السولار</h2>
              </div>

              {dieselReport ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-slate-100 divide-y divide-slate-100">
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">رصيد الافتتاح</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dieselReport.openingBalance.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">لتر</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">الوارد</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dieselReport.received.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">لتر</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">المنصرف</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dieselReport.distributed.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">لتر</p>
                    </div>
                    <div className="p-4 bg-green-50">
                      <p className="text-sm text-green-600 mb-1">المتبقي</p>
                      <p className="text-2xl font-bold text-green-600">
                        {dieselReport.remaining.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-green-500">لتر</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                  <Fuel className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد بيانات سولار</p>
                </div>
              )}
            </div>

            {/* Salt Report */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-800">تقرير الملح</h2>
              </div>

              {saltReport ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-slate-100 divide-y divide-slate-100">
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">رصيد الافتتاح</p>
                      <p className="text-2xl font-bold text-teal-600">
                        {saltReport.openingBalance.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">كجم</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">الإنتاج</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {saltReport.production.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">كجم</p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-500 mb-1">المنصرف</p>
                      <p className="text-2xl font-bold text-red-600">
                        {saltReport.distributed.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-slate-400">كجم</p>
                    </div>
                    <div className="p-4 bg-green-50">
                      <p className="text-sm text-green-600 mb-1">المتبقي</p>
                      <p className="text-2xl font-bold text-green-600">
                        {saltReport.remaining.toLocaleString('ar-EG')}
                      </p>
                      <p className="text-xs text-green-500">كجم</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                  <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">لا توجد بيانات ملح</p>
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className="space-y-3">
              <Button
                onClick={exportToExcel}
                disabled={exporting}
                className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl shadow-lg shadow-green-600/25 text-lg font-medium flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileSpreadsheet className="w-5 h-5" />
                    تصدير Excel
                  </>
                )}
              </Button>

              <Button
                onClick={exportToPDF}
                disabled={exporting}
                className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl shadow-lg shadow-red-600/25 text-lg font-medium flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    تصدير PDF
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
