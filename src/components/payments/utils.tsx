
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN').format(value);
};

export const parseCurrencyAmount = (amountStr: string): number => {
  const cleanAmount = amountStr.replace(/[₹,\s]/g, '').replace(/[^\d.-]/g, '');
  return parseFloat(cleanAmount) || 0;
};

export const parseDate = (dateStr: string): number => {
  if (!isNaN(Number(dateStr))) {
    return Number(dateStr);
  }
  
  try {
    if (dateStr.includes('-')) {
      const [monthPart, yearPart] = dateStr.split('-');
      let month: number;
      let year: number;
      
      if (isNaN(Number(monthPart))) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        month = monthNames.findIndex(name => monthPart.toLowerCase().startsWith(name.toLowerCase())) + 1;
        year = parseInt(yearPart);
      } else {
        year = parseInt(monthPart);
        month = parseInt(yearPart);
      }
      
      if (month && year) {
        const baselineYear = 2024;
        const baselineMonth = 1;
        return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
      }
    }
    
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const baselineYear = 2024;
      const baselineMonth = 1;
      return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
    }
  } catch (error) {
    console.error('Date parsing error:', error);
  }
  
  return 1;
};

export const monthToDate = (month: number): Date => {
  const baselineYear = 2024;
  const baselineMonth = 1;
  
  const totalMonths = month - 1 + baselineMonth - 1;
  const year = baselineYear + Math.floor(totalMonths / 12);
  const monthNum = (totalMonths % 12) + 1;
  
  return new Date(year, monthNum - 1, 1);
};

export const dateToMonth = (date: Date): number => {
  const baselineYear = 2024;
  const baselineMonth = 1;
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  return (year - baselineYear) * 12 + (month - baselineMonth) + 1;
};
