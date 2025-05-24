import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  yearRange?: { from: number; to: number };
};

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  yearRange = { from: 2023, to: 2030 },
  ...props
}: EnhancedCalendarProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState<Date>(() => {
    // Handle different types that might be in props.selected
    if (props.selected instanceof Date) {
      return props.selected;
    } else if (props.defaultMonth instanceof Date) {
      return props.defaultMonth;
    }
    return today;
  });

  // Generate year and month options
  const years = Array.from(
    { length: yearRange.to - yearRange.from + 1 },
    (_, i) => yearRange.from + i
  );

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function handleYearChange(year: string) {
    const newDate = new Date(selectedMonth);
    newDate.setFullYear(parseInt(year));
    setSelectedMonth(newDate);
  }

  function handleMonthChange(month: string) {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(months.indexOf(month));
    setSelectedMonth(newDate);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <Select
          value={selectedMonth.getFullYear().toString()}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()} className="text-xs">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={months[selectedMonth.getMonth()]}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month} className="text-xs">
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: "hidden", // Hide default caption since we're using our custom selects
          caption_label: "hidden",
          nav: "hidden", // Hide default navigation
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        {...props}
      />
    </div>
  );
}
EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar };
