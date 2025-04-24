import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy');
}

export function formatTimeRemaining(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function calculateTotalMonthlySpending(subscriptions: any[]): number {
  return subscriptions.reduce((total, sub) => {
    if (sub.billingCycle === 'monthly') {
      return total + sub.amount;
    } else if (sub.billingCycle === 'yearly') {
      return total + (sub.amount / 12);
    } else if (sub.billingCycle === 'quarterly') {
      return total + (sub.amount / 3);
    } else if (sub.billingCycle === 'weekly') {
      return total + (sub.amount * 4.33); // Average 4.33 weeks per month
    }
    return total;
  }, 0);
}

export function getUpcomingSubscription(subscriptions: any[]): any | null {
  if (!subscriptions.length) return null;
  
  // Sort by due date ascending
  const sorted = [...subscriptions].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  
  // Find the first subscription with a due date in the future
  const now = new Date();
  const upcoming = sorted.find(sub => new Date(sub.dueDate) > now);
  
  return upcoming || sorted[0]; // Return the first future due date or the first one if all are past
}

export function getSubscriptionStatusClass(dueDate: Date | string): {
  bgColor: string;
  textColor: string;
  label: string;
} {
  const date = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { bgColor: 'bg-red-100', textColor: 'text-red-800', label: 'Overdue' };
  } else if (diffDays < 3) {
    return { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'Upcoming' };
  } else {
    return { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Active' };
  }
}

export function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'entertainment':
      return 'Film';
    case 'music':
      return 'Music';
    case 'productivity':
      return 'Laptop';
    case 'security':
      return 'Shield';
    case 'utilities':
      return 'Lightbulb';
    case 'health':
      return 'Heart';
    case 'gaming':
      return 'Gamepad2';
    case 'education':
      return 'GraduationCap';
    case 'food':
      return 'UtensilsCrossed';
    default:
      return 'CreditCard';
  }
}

export function getCategoryColorClass(category: string): {
  bgLight: string;
  textDark: string;
} {
  switch (category.toLowerCase()) {
    case 'entertainment':
      return { bgLight: 'bg-primary-50', textDark: 'text-primary-600' };
    case 'music':
      return { bgLight: 'bg-purple-50', textDark: 'text-purple-600' };
    case 'productivity':
      return { bgLight: 'bg-blue-50', textDark: 'text-blue-600' };
    case 'security':
      return { bgLight: 'bg-indigo-50', textDark: 'text-indigo-600' };
    case 'utilities':
      return { bgLight: 'bg-green-50', textDark: 'text-green-600' };
    case 'health':
      return { bgLight: 'bg-red-50', textDark: 'text-red-600' };
    case 'gaming':
      return { bgLight: 'bg-orange-50', textDark: 'text-orange-600' };
    case 'education':
      return { bgLight: 'bg-yellow-50', textDark: 'text-yellow-600' };
    case 'food':
      return { bgLight: 'bg-amber-50', textDark: 'text-amber-600' };
    default:
      return { bgLight: 'bg-gray-50', textDark: 'text-gray-600' };
  }
}

export function calculateCategoryPercentage(categoryTotal: number, overallTotal: number): number {
  if (overallTotal === 0) return 0;
  return Math.round((categoryTotal / overallTotal) * 100);
}
