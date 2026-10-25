import { useState } from 'react';
import { Calendar } from '@/components/panel/calendar';
import { Countdown } from '@/components/panel/countdown';
import { DatePicker } from '@/components/panel/date-picker';
import { DateTimePicker } from '@/components/panel/date-time-picker';
import { Planner } from '@/components/panel/planner';
import { TimePicker } from '@/components/panel/time-picker';
import type { TimeValue } from '@/lib/time';
import { Demo } from '../demo';

export function Dates() {
  const [day, setDay] = useState<Date>();
  const [pick, setPick] = useState<Date>();
  const [time, setTime] = useState<TimeValue>();
  const [when, setWhen] = useState<Date>();
  const [month, setMonth] = useState(new Date());
  const [soon] = useState(() => new Date(Date.now() + 90 * 60 * 1000));
  return (
    <>
      <Demo title="Calendar"><Calendar mode="single" selected={day} onSelect={setDay} /></Demo>
      <Demo title="DatePicker"><DatePicker selected={pick} onSelect={setPick} placeholder="Pick a date" /></Demo>
      <Demo title="TimePicker"><TimePicker value={time} onValueChange={setTime} /></Demo>
      <Demo title="DateTimePicker"><DateTimePicker value={when} onValueChange={setWhen} placeholder="Pick a day and time" /></Demo>
      <Demo title="Countdown" note="Ticks to a moment 90 minutes from now."><Countdown to={soon} urgentBelow={7200} /></Demo>
      <Demo title="Planner">
        <Planner month={month} onMonthChange={setMonth} entries={[]} categories={[{ id: 'drive', label: 'Test drive' }]}>
          <Planner.Header><Planner.Title /><Planner.Today /><Planner.Nav /></Planner.Header>
          <Planner.Grid />
        </Planner>
      </Demo>
    </>
  );
}
