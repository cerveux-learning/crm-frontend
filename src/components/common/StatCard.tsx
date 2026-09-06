import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 sm:mt-4 flex items-baseline justify-between gap-2">
        <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{value}</h4>
        
        {trend && (
          <div
            className={`inline-flex items-center text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              trend.isPositive !== false
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive !== false ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
            )}
            {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] sm:text-xs text-slate-400 font-medium truncate">{subtitle}</p>
      )}
    </div>
  );
};
