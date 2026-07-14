import React from 'react';
import { useScheduleData } from './hooks/useScheduleData';
import { ScheduleForm } from './components/ScheduleForm';
import { ScheduleList } from './components/ScheduleList';

export default function UploadSchedule() {
  const scheduleHook = useScheduleData();

  return (
    <div className="space-y-6">
      <ScheduleForm hook={scheduleHook} />
      <ScheduleList hook={scheduleHook} />
    </div>
  );
}
